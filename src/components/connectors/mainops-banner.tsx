import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { getMainOpsSummary, currentMonthPeriod } from "@/server/queries/mainops";
import { labelForPurchaseType } from "@/lib/connectors/mainops";
import { getTool } from "@/lib/tools";
import { formatEurCompact } from "@/lib/utils/format-currency";

/**
 * Server Component que fetcha métricas reales de MainOps y renderiza
 * el bloque ToolSummary (escudo + atajo + nombre + updates).
 *
 * Hero del escudo: % on-time del SLA (sla.on_time_pct × 100).
 * Si la API falla, escudo neutro con mensaje y la home no se rompe.
 */
export async function MainOpsBanner() {
  const tool = getTool("mainops");
  const period = currentMonthPeriod();
  const result = await getMainOpsSummary(period);

  if (!result.ok) {
    const updates: UpdateItem[] = [
      {
        id: "mainops-error",
        occurredAt: new Date(),
        title: "API MainOps no disponible",
        description: result.error,
      },
    ];
    return (
      <ToolSummary tool={tool} heroValue={null} heroStatus="neutral" updates={updates} />
    );
  }

  const m = result.data;

  // Hero = on_time_pct (ratio 0..1) → porcentaje 0..100.
  const heroValue = Math.round(m.sla.onTimePct * 1000) / 10; // 1 decimal

  // Semáforo SLA: ≥95 verde, ≥85 ámbar, <85 rojo.
  const heroStatus: ShieldStatus =
    heroValue >= 95 ? "ok" : heroValue >= 85 ? "warn" : "danger";

  // Línea 1: Volumen + revenue (sin ticket medio, según decisión user).
  const totalOrders = m.kpis.totalOrders;
  const revenueShort = formatEurCompact(m.kpis.totalRevenueEur);

  // Línea 2: SLA detalle.
  const avgDays = m.sla.avgDeliveryDays.toFixed(1);
  const slaParts: string[] = [`${avgDays}d promedio`];
  if (m.sla.breachedCount > 0) slaParts.push(`${m.sla.breachedCount} rotos`);
  if (m.sla.activeAtRisk > 0) slaParts.push(`${m.sla.activeAtRisk} en riesgo`);

  // Línea 3: top compras (top 2 por count).
  const topPurchases = [...m.breakdowns.byPurchaseType]
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  const topLabel = topPurchases
    .map((p) => {
      const pct =
        totalOrders > 0 ? Math.round((p.count / totalOrders) * 100) : 0;
      return `${labelForPurchaseType(p.purchaseType)} ${pct}%`;
    })
    .join(" · ");

  const updates: UpdateItem[] = [
    {
      id: "volume",
      occurredAt: m.generatedAt,
      title: `${totalOrders} pedidos`,
      description: `${revenueShort} facturado en el periodo`,
    },
    {
      id: "sla",
      occurredAt: m.generatedAt,
      title: `SLA: ${avgDays}d entrega`,
      description: slaParts.slice(1).join(" · ") || "Sin incidencias SLA",
    },
    {
      id: "top-purchases",
      occurredAt: m.generatedAt,
      title: "Top compras",
      description: topLabel || "Sin pedidos en el periodo",
    },
  ];

  return (
    <ToolSummary
      tool={tool}
      heroValue={heroValue}
      heroStatus={heroStatus}
      updates={updates}
    />
  );
}
