import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getMainOpsSummary } from "@/server/queries/mainops";
import { getHwToolSummary } from "@/server/queries/hwtool";
import { getHsmSummary } from "@/server/queries/hsm";
import { buildEmptyContent } from "./defaults";
import type { ReportContent } from "./schema";

const { reportKpiDefinitions } = schema;

interface Range {
  from: Date;
  to: Date;
}

type ExecRow = ReportContent["executiveSummary"]["rows"][number];
type SemStatus = ExecRow["status"];

const round1 = (v: number): number => Math.round(v * 10) / 10;

function formatVal(v: number, unit: string): string {
  if (unit === "%") return `${round1(v)}%`;
  if (unit === "€") return `${Math.round(v).toLocaleString("es-ES")} €`;
  if (unit === "días" || unit === "d") return `${round1(v)} días`;
  if (unit === "h") return `${round1(v)}h`;
  return round1(v).toLocaleString("es-ES");
}

function formatDelta(diff: number, unit: string): string {
  const d = round1(diff);
  if (d === 0) return "= vs anterior";
  const sign = d > 0 ? "+" : "";
  if (unit === "%") return `${sign}${d} pp vs anterior`;
  return `${sign}${formatVal(Math.abs(d), unit).replace(/^/, d < 0 ? "-" : "")} vs anterior`;
}

function computeStatus(
  actual: number | null,
  target: number | null,
  direction: string,
): SemStatus {
  if (actual == null || target == null) return "neutral";
  const higher = direction !== "lower-is-better";
  if (higher) {
    if (actual >= target) return "verde";
    if (actual >= target * 0.9) return "amarillo";
    return "rojo";
  }
  if (actual <= target) return "verde";
  if (actual <= target * 1.1) return "amarillo";
  return "rojo";
}

interface KpiValue {
  value: number | null;
  prev: number | null;
}

/**
 * Construye un `ReportContent` pre-rellenado para el periodo dado:
 *  - Métricas de configuraciones/envíos/soporte desde los 3 conectores.
 *  - Filas del resumen ejecutivo desde el catálogo `report_kpi_definitions`,
 *    con actual (conector), target (catálogo), Δ (periodo anterior) y semáforo.
 *
 * Best-effort: si un conector falla, sus campos quedan vacíos (editables a mano).
 * La narrativa y tablas cualitativas (tesis, bloqueos, decisiones, cajones,
 * foco) siempre quedan vacías para rellenar manualmente.
 */
export async function buildAutofilledContent(range: Range): Promise<ReportContent> {
  const content = buildEmptyContent();
  const filter = { from: range.from, to: range.to };

  const [mainops, hwtool, hsm, defs] = await Promise.all([
    getMainOpsSummary(filter),
    getHwToolSummary(filter),
    getHsmSummary(filter),
    db
      .select()
      .from(reportKpiDefinitions)
      .where(eq(reportKpiDefinitions.active, true)),
  ]);

  const kpi: Record<string, KpiValue> = {};
  const set = (key: string, value: number | null, prev: number | null = null) => {
    kpi[key] = { value, prev };
  };

  // ── MainOps → envíos + KPIs ────────────────────────────────────────────────
  if (mainops.ok) {
    const m = mainops.data;
    const completed = m.ops?.totalCompleted ?? Math.round(m.kpis.totalOrders * m.kpis.completedRate);
    const shipped = m.ops?.totalShipped ?? null;
    const pending = m.breakdowns.byStatus.find((s) => s.status === "pendiente")?.count ?? null;
    const slaPct = round1(m.sla.onTimePct * 100);

    content.envios.totalOps = m.kpis.totalOrders;
    content.envios.completed = completed;
    content.envios.shipped = shipped;
    content.envios.pending = pending;
    content.envios.grossRevenue = Math.round(m.kpis.totalRevenueEur);
    content.envios.avgDeliveryDays = round1(m.sla.avgDeliveryDays);
    content.envios.sla7dPct = slaPct;

    set("mainops.total_orders", m.kpis.totalOrders, m.comparison?.prevTotalOrders ?? null);
    set("mainops.completed_orders", completed);
    set("mainops.pending_orders", pending);
    set("mainops.sla_7d_pct", slaPct);
    set("mainops.avg_delivery_days", round1(m.sla.avgDeliveryDays));
    set("mainops.gross_revenue", Math.round(m.kpis.totalRevenueEur), m.comparison?.prevTotalRevenueEur ?? null);
  }

  // ── HW Tool → configuraciones ──────────────────────────────────────────────
  if (hwtool.ok) {
    const h = hwtool.data;
    content.configuraciones.totalConfigs = h.principal.configuracion;
    content.configuraciones.successRate1st = round1(h.successRateFirstTry);
    content.configuraciones.successRate2nd = round1(h.secondConfigRate);

    set("hwtool.total_configs", h.principal.configuracion);
    set("hwtool.success_rate_pct", round1(h.successRateFirstTry));
  }

  // ── HSM → soporte ──────────────────────────────────────────────────────────
  if (hsm.ok) {
    const s = hsm.data.current;
    const p = hsm.data.previous;
    content.soporte.openIncidents = s.openIncidents;
    content.soporte.activeRmas = s.activeRmas;
    content.soporte.sla7dPct = round1(s.slaCompliancePct);
    content.soporte.reopenRatePct = round1(s.reopenRatePct);
    content.soporte.avgResolutionHours = s.avgResolutionHours != null ? round1(s.avgResolutionHours) : null;

    set("hsm.open_incidents", s.openIncidents, p.openIncidentsAtClose ?? null);
    set("hsm.active_rmas", s.activeRmas);
    set("hsm.sla_compliance_pct", round1(s.slaCompliancePct), round1(p.slaCompliancePct));
    set(
      "hsm.avg_resolution_hours",
      s.avgResolutionHours != null ? round1(s.avgResolutionHours) : null,
      p.avgResolutionHours != null ? round1(p.avgResolutionHours) : null,
    );
    set("hsm.reopen_rate_pct", round1(s.reopenRatePct), round1(p.reopenRatePct));
  }

  // ── Resumen ejecutivo desde el catálogo ─────────────────────────────────────
  const rows: ExecRow[] = defs
    .slice()
    .sort((a, b) => a.sectionKey.localeCompare(b.sectionKey) || a.label.localeCompare(b.label))
    .map((d) => {
      const v = kpi[d.kpiKey];
      const unit = d.unit ?? "";
      const targetNum = d.target != null ? Number(d.target) : null;
      const actualNum = v?.value ?? null;
      return {
        id: globalThis.crypto.randomUUID(),
        kpiKey: d.kpiKey,
        label: d.label,
        unit,
        target: targetNum != null ? formatVal(targetNum, unit) : "",
        actual: actualNum != null ? formatVal(actualNum, unit) : "",
        delta: v && v.value != null && v.prev != null ? formatDelta(v.value - v.prev, unit) : "",
        source: "auto",
        status: computeStatus(actualNum, targetNum, d.direction),
        comment: "",
      };
    });

  content.executiveSummary.rows = rows;

  return content;
}
