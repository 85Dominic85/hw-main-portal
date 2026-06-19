import "server-only";

import { getMainOpsSummary } from "@/server/queries/mainops";
import { getHwToolSummary } from "@/server/queries/hwtool";
import { getHsmSummary } from "@/server/queries/hsm";
import { type KpiSnapshot, type KpiSnapshotEntry } from "./schema";

interface SnapshotRange {
  from: Date;
  to: Date;
}

/**
 * Construye un snapshot de KPIs llamando a los 3 conectores en paralelo.
 * Se llama al publicar un informe para congelar los valores del periodo.
 *
 * Los conectores que fallen se registran en `sourceHealth` con ok=false
 * pero no bloquean el resto — el caller puede decidir si bloquear el publish
 * cuando sourceHealth de un conector crítico es false.
 *
 * Se filtran los campos voluminosos (time_series, recent_orders >10,
 * top_providers >5) para mantener el snapshot <50KB.
 */
export async function buildKpiSnapshot(range: SnapshotRange): Promise<KpiSnapshot> {
  const frozenAt = new Date().toISOString();
  const periodFrom = range.from.toISOString().slice(0, 10);
  const periodTo = range.to.toISOString().slice(0, 10);

  const filter = { from: range.from, to: range.to };

  const [mainopsResult, hwtoolResult, hsmResult] = await Promise.all([
    getMainOpsSummary(filter),
    getHwToolSummary(filter),
    getHsmSummary(filter),
  ]);

  const entries: KpiSnapshotEntry[] = [];

  // ── MainOPS ───────────────────────────────────────────────────────────────
  if (mainopsResult.ok) {
    const m = mainopsResult.data;
    const completed = Math.round(m.kpis.totalOrders * m.kpis.completedRate);
    const pending = m.breakdowns.byStatus.find((s) => s.status === "pendiente")?.count ?? null;
    entries.push(
      { key: "mainops.total_orders",      value: m.kpis.totalOrders,          unit: "pedidos", source: "mainops" },
      { key: "mainops.completed_orders",  value: completed,                    unit: "pedidos", source: "mainops" },
      { key: "mainops.pending_orders",    value: pending,                      unit: "pedidos", source: "mainops" },
      { key: "mainops.sla_7d_pct",        value: m.sla.onTimePct * 100,        unit: "%",       source: "mainops" },
      { key: "mainops.avg_delivery_days", value: m.sla.avgDeliveryDays,        unit: "días",    source: "mainops" },
      { key: "mainops.gross_revenue",     value: m.kpis.totalRevenueEur,       unit: "€",       source: "mainops" },
    );
  }

  // ── HW Tool ───────────────────────────────────────────────────────────────
  if (hwtoolResult.ok) {
    const h = hwtoolResult.data;
    entries.push(
      { key: "hwtool.total_configs",    value: h.principal.configuracion, unit: "configs", source: "hwtool" },
      { key: "hwtool.success_rate_pct", value: h.successRateFirstTry,     unit: "%",       source: "hwtool" },
    );
  }

  // ── HSM ───────────────────────────────────────────────────────────────────
  if (hsmResult.ok) {
    const s = hsmResult.data.current;
    entries.push(
      { key: "hsm.open_incidents",       value: s.openIncidents,       unit: "#",  source: "hsm" },
      { key: "hsm.active_rmas",          value: s.activeRmas,          unit: "#",  source: "hsm" },
      { key: "hsm.sla_compliance_pct",   value: s.slaCompliancePct,    unit: "%",  source: "hsm" },
      { key: "hsm.avg_resolution_hours", value: s.avgResolutionHours,  unit: "h",  source: "hsm" },
      { key: "hsm.reopen_rate_pct",      value: s.reopenRatePct,       unit: "%",  source: "hsm" },
    );
  }

  return {
    version: 1,
    frozenAt,
    periodFrom,
    periodTo,
    sourceHealth: {
      mainops: {
        ok: mainopsResult.ok,
        error: mainopsResult.ok ? undefined : mainopsResult.error,
        fetchedAt: frozenAt,
      },
      hwtool: {
        ok: hwtoolResult.ok,
        error: hwtoolResult.ok ? undefined : hwtoolResult.error,
        fetchedAt: frozenAt,
      },
      hsm: {
        ok: hsmResult.ok,
        error: hsmResult.ok ? undefined : hsmResult.error,
        fetchedAt: frozenAt,
      },
    },
    entries,
  };
}
