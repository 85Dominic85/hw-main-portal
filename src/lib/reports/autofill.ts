import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getMainOpsSummary } from "@/server/queries/mainops";
import { getHwToolSummary } from "@/server/queries/hwtool";
import { getHsmSummary } from "@/server/queries/hsm";
import type { MainOpsMetrics } from "@/lib/connectors/mainops";
import type { HwToolMetrics } from "@/lib/connectors/hwtool";
import type { HsmMetrics } from "@/lib/connectors/hsm";
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

/** Métricas de un periodo (cada conector puede faltar si su fetch falló). */
interface PeriodSources {
  mainops: MainOpsMetrics | null;
  hwtool: HwToolMetrics | null;
  hsm: HsmMetrics["current"] | null;
}

/**
 * Extractores AUTO por `kpiKey`: devuelven el valor numérico del KPI para un
 * periodo dado (o null si falta el conector). Se aplican al periodo actual y al
 * anterior para rellenar "Actual" y "Semana anterior". Un KPI sin extractor se
 * considera MANUAL (fila vacía editable).
 */
const AUTO_EXTRACTORS: Record<string, (s: PeriodSources) => number | null> = {
  "hwtool.configs_confirmed": (s) => s.hwtool?.principal.configuracion ?? null,
  "hwtool.success_first_try": (s) =>
    s.hwtool ? round1(s.hwtool.successRateFirstTry) : null,
  "hwtool.total_sessions": (s) => s.hwtool?.principal.totalSessions ?? null,
  "mainops.total_shipments": (s) => s.mainops?.kpis.totalOrders ?? null,
  "mainops.sla_7d": (s) => (s.mainops ? round1(s.mainops.sla.onTimePct * 100) : null),
  "hsm.incidents_over_7d": (s) =>
    s.hsm ? s.hsm.agingDistribution.find((a) => a.bucket === "gt_7d")?.count ?? 0 : null,
};

/** Orden de las filas del resumen ejecutivo (scorecard del departamento). */
const EXEC_ORDER = [
  "exec.margin",
  "hwtool.configs_confirmed",
  "hwtool.success_first_try",
  "exec.pnp_coverage",
  "mainops.total_shipments",
  "mainops.sla_7d",
  "hsm.incidents_over_7d",
  "exec.rma_response_2h",
  "exec.delivery_rate",
  "exec.cajones_mrr",
  "hwtool.total_sessions",
];

/** Ventana inmediatamente anterior de igual longitud (semana/mes previo). */
function previousRange(range: Range): Range {
  const span = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - span - 1),
    to: new Date(range.from.getTime() - 1),
  };
}

/**
 * Construye un `ReportContent` pre-rellenado para el periodo dado:
 *  - Bloques de configuraciones/envíos/soporte desde el periodo actual.
 *  - Filas del resumen ejecutivo desde el catálogo `report_kpi_definitions`,
 *    con Actual (periodo actual), "Semana anterior" (periodo previo real),
 *    target (catálogo), owner (catálogo) y semáforo.
 *
 * Best-effort: si un conector falla, sus campos quedan vacíos (editables a mano).
 * Los KPIs sin extractor (Margen, Cobertura PnP, Resp. RMA <2h, Tasa entrega,
 * Cajones MRR) nacen como fila vacía editable. La narrativa y tablas cualitativas
 * (tesis, bloqueos, decisiones, cajones, foco) siempre quedan vacías.
 */
export async function buildAutofilledContent(range: Range): Promise<ReportContent> {
  const content = buildEmptyContent();
  const prev = previousRange(range);

  const [moCur, htCur, hsmCur, moPrev, htPrev, hsmPrev, defs] = await Promise.all([
    getMainOpsSummary({ from: range.from, to: range.to }),
    getHwToolSummary({ from: range.from, to: range.to }),
    getHsmSummary({ from: range.from, to: range.to }),
    getMainOpsSummary({ from: prev.from, to: prev.to }),
    getHwToolSummary({ from: prev.from, to: prev.to }),
    getHsmSummary({ from: prev.from, to: prev.to }),
    db
      .select()
      .from(reportKpiDefinitions)
      .where(eq(reportKpiDefinitions.active, true)),
  ]);

  const cur: PeriodSources = {
    mainops: moCur.ok ? moCur.data : null,
    hwtool: htCur.ok ? htCur.data : null,
    hsm: hsmCur.ok ? hsmCur.data.current : null,
  };
  const prv: PeriodSources = {
    mainops: moPrev.ok ? moPrev.data : null,
    hwtool: htPrev.ok ? htPrev.data : null,
    hsm: hsmPrev.ok ? hsmPrev.data.current : null,
  };

  // ── Bloques de sección (periodo actual) ────────────────────────────────────
  if (moCur.ok) {
    const m = moCur.data;
    const completed =
      m.ops?.totalCompleted ?? Math.round(m.kpis.totalOrders * m.kpis.completedRate);
    const shipped = m.ops?.totalShipped ?? null;
    const pending = m.breakdowns.byStatus.find((s) => s.status === "pendiente")?.count ?? null;
    content.envios.totalOps = m.kpis.totalOrders;
    content.envios.completed = completed;
    content.envios.shipped = shipped;
    content.envios.pending = pending;
    content.envios.grossRevenue = Math.round(m.kpis.totalRevenueEur);
    content.envios.avgDeliveryDays = round1(m.sla.avgDeliveryDays);
    content.envios.sla7dPct = round1(m.sla.onTimePct * 100);
  }

  if (htCur.ok) {
    const h = htCur.data;
    content.configuraciones.totalConfigs = h.principal.configuracion;
    content.configuraciones.successRate1st = round1(h.successRateFirstTry);
    content.configuraciones.successRate2nd = round1(h.secondConfigRate);
  }

  if (hsmCur.ok) {
    const s = hsmCur.data.current;
    content.soporte.openIncidents = s.openIncidents;
    content.soporte.activeRmas = s.activeRmas;
    content.soporte.sla7dPct = round1(s.slaCompliancePct);
    content.soporte.reopenRatePct = round1(s.reopenRatePct);
    content.soporte.avgResolutionHours =
      s.avgResolutionHours != null ? round1(s.avgResolutionHours) : null;
  }

  // ── Resumen ejecutivo desde el catálogo ─────────────────────────────────────
  const orderIndex = (k: string) => {
    const i = EXEC_ORDER.indexOf(k);
    return i === -1 ? EXEC_ORDER.length : i;
  };

  const rows: ExecRow[] = defs
    .slice()
    .sort((a, b) => orderIndex(a.kpiKey) - orderIndex(b.kpiKey) || a.label.localeCompare(b.label))
    .map((d) => {
      const unit = d.unit ?? "";
      const targetNum = d.target != null ? Number(d.target) : null;
      const extractor = AUTO_EXTRACTORS[d.kpiKey];
      const isAuto = Boolean(extractor);
      const actualNum = extractor ? extractor(cur) : null;
      const prevNum = extractor ? extractor(prv) : null;
      return {
        id: globalThis.crypto.randomUUID(),
        kpiKey: d.kpiKey,
        label: d.label,
        unit,
        owner: d.owner ?? "",
        target: targetNum != null ? formatVal(targetNum, unit) : "",
        actual: actualNum != null ? formatVal(actualNum, unit) : "",
        delta: prevNum != null ? formatVal(prevNum, unit) : "",
        source: isAuto ? "auto" : "manual",
        status: isAuto ? computeStatus(actualNum, targetNum, d.direction) : "neutral",
        comment: "",
      };
    });

  content.executiveSummary.rows = rows;

  return content;
}
