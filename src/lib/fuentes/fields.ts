/**
 * Traduce el shape mapeado de cada conector a filas legibles para el inspector
 * "Fuentes": etiqueta · valor · unidad · a qué KPI del informe alimenta ("por
 * qué"). El `feeds` refleja el mapeo real de `AUTO_EXTRACTORS` (autofill.ts):
 * si cambia el autofill, actualizar aquí las anotaciones `feeds`.
 *
 * Módulo neutro (solo tipos de conector) — importable desde server components.
 */
import type { MainOpsMetrics } from "@/lib/connectors/mainops";
import type { HwToolMetrics } from "@/lib/connectors/hwtool";
import type { HsmMetrics } from "@/lib/connectors/hsm";

export interface DataRow {
  label: string;
  value: string;
  unit?: string;
  /** KPI del resumen ejecutivo que alimenta este dato (el "por qué"). */
  feeds?: string;
}

const nf = (n: number) => n.toLocaleString("es-ES");
const eur = (n: number) => `${Math.round(n).toLocaleString("es-ES")} €`;
const pctRatio = (n: number) => `${Math.round(n * 1000) / 10}%`; // 0..1 → %
const pct100 = (n: number) => `${Math.round(n * 10) / 10}%`; // ya 0..100
const dec1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("es-ES");
const nOrDash = (n: number | null | undefined, fmt: (v: number) => string) =>
  n == null ? "—" : fmt(n);

export function mainopsRows(m: MainOpsMetrics): DataRow[] {
  const rows: DataRow[] = [
    { label: "Pedidos totales (todo)", value: nf(m.kpis.totalOrders), unit: "pedidos" },
    { label: "Facturación bruta", value: eur(m.kpis.totalRevenueEur), feeds: "Margen (referencia)" },
    { label: "Ticket medio", value: eur(m.kpis.avgOrderValueEur) },
    { label: "% completados", value: pctRatio(m.kpis.completedRate) },
    { label: "SLA <7d (on-time)", value: pctRatio(m.sla.onTimePct), feeds: "SLA <7d" },
    { label: "Plazo medio entrega", value: dec1(m.sla.avgDeliveryDays), unit: "días" },
    { label: "Entregas totales", value: nf(m.sla.totalDelivered) },
    { label: "Fuera de plazo", value: nf(m.sla.breachedCount) },
    { label: "En riesgo ahora", value: nf(m.sla.activeAtRisk) },
  ];
  if (m.ops) {
    rows.push(
      { label: "Envíos físicos (shipped)", value: nf(m.ops.totalShipped), unit: "envíos", feeds: "Envíos totales (of.+prov.)" },
      { label: "Completados físicos", value: nf(m.ops.totalCompleted) },
      { label: "Días manipulación (dpto)", value: dec1(m.ops.avgHandlingDays), unit: "días" },
      { label: "Días tránsito (transportista)", value: dec1(m.ops.avgTransitDays), unit: "días" },
      { label: "% envío en plazo (≤5d)", value: pctRatio(m.ops.onTimeShippingPct) },
      { label: "Bloqueados", value: nf(m.ops.blockedCount) },
      { label: "Excluidos (SaaS/admin)", value: nf(m.ops.excludedAdmin) },
    );
  }
  rows.push(
    { label: "Tipos de compra (categorías)", value: nf(m.breakdowns.byPurchaseType.length) },
    { label: "Estados distintos", value: nf(m.breakdowns.byStatus.length) },
    { label: "Pedidos recientes (muestra)", value: nf(m.recentOrders.length) },
  );
  return rows;
}

export function hwtoolRows(h: HwToolMetrics): DataRow[] {
  const rows: DataRow[] = [
    { label: "Total registros (sesiones)", value: nf(h.principal.totalSessions), unit: "registros", feeds: "Total registros (HW Tool)" },
    { label: "Configuraciones", value: nf(h.principal.configuracion), unit: "configs" },
    { label: "Auditorías", value: nf(h.principal.auditoria) },
    { label: "No-shows", value: nf(h.principal.noshow) },
    { label: "% éxito 1ª config (excl. PnP)", value: pct100(h.successRateFirstTry), feeds: "% éxito 1º intento (excl. PnP)" },
    { label: "% requiere 2ª config", value: pct100(h.secondConfigRate) },
    { label: "Config OK a 1ª", value: nf(h.detailed.configOk.count) },
    { label: "Config PnP", value: nf(h.detailed.configPnp.count) },
    { label: "Config requiere 2ª", value: nf(h.detailed.configRequires2nd.count) },
    { label: "Equipos propios", value: nf(h.equipment.own.count) },
    { label: "Equipos externos", value: nf(h.equipment.external.count) },
    { label: "Tipos de problema", value: nf(h.problems.length) },
  ];
  if (h.crmTest) {
    rows.push({ label: "CRM test (sesiones)", value: nf(h.crmTest.count) });
  }
  return rows;
}

export function hsmRows(s: HsmMetrics): DataRow[] {
  const c = s.current;
  const over7d = c.agingDistribution.find((a) => a.bucket === "gt_7d")?.count ?? 0;
  return [
    { label: "Incidencias abiertas", value: nf(c.openIncidents) },
    { label: "Incidencias >7d", value: nf(over7d), feeds: "Incidencias >7d" },
    { label: "RMAs activos", value: nf(c.activeRmas) },
    { label: "SLA cumplido", value: pct100(c.slaCompliancePct) },
    { label: "Δ SLA vs anterior", value: `${s.slaDeltaPp > 0 ? "+" : ""}${dec1(s.slaDeltaPp)} pp` },
    { label: "Vencidas ahora", value: nf(c.overdueCount) },
    { label: "Resolución media", value: nOrDash(c.avgResolutionHours, (v) => dec1(v)), unit: "h" },
    { label: "Tasa reapertura", value: pct100(c.reopenRatePct) },
    { label: "Turnaround RMA", value: nOrDash(c.avgRmaTurnaroundDays, (v) => dec1(v)), unit: "días" },
    { label: "Críticas en plazo", value: nOrDash(c.criticalInSlaPct, (v) => pct100(v)) },
    { label: "Throughput (cerradas/creadas)", value: dec1(c.throughputRatio) },
    { label: "Top proveedores (muestra)", value: nf(c.topProviders.length) },
  ];
}
