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
 * Hero del escudo (decidido 2026-04-30 tras CHANGELOG de MainOps):
 *   - Si la API devuelve `ops` (post-2026-04-30): usar `ops.on_time_shipping_pct`
 *     (% envíos despachados en ≤5 días — lo que controla el depto).
 *   - Si no, fallback a `sla.on_time_pct` (SLA end-to-end, incluye transporte).
 *
 * Línea 2 del banner:
 *   - Si hay `ops`: separación handling/transit (depto vs TIPSA).
 *   - Si no, fallback al texto SLA tradicional.
 *
 * Si la API falla: escudo neutro con mensaje y la home no se rompe.
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
        title: "API Logística no disponible",
        description: result.error,
      },
    ];
    return (
      <ToolSummary tool={tool} heroValue={null} heroStatus="neutral" updates={updates} />
    );
  }

  const m = result.data;

  // Hero — preferir on_time_shipping (depto) si está disponible; si no, SLA global.
  const heroRatio = m.ops?.onTimeShippingPct ?? m.sla.onTimePct;
  const heroValue = Math.round(heroRatio * 1000) / 10; // 1 decimal en 0-100

  // Semáforo: umbrales distintos según métrica.
  //   - Si usamos `ops.onTimeShippingPct` (handling depto, ≤5d): ≥85 ok / ≥70 warn / <70 danger.
  //     Calibrado para lo que el depto realmente controla (sin TIPSA).
  //   - Si caemos al fallback `sla.onTimePct` (end-to-end con transporte): ≥95 / ≥85 / <85.
  //     Más exigente porque SLA "completo" debería ser casi perfecto.
  const heroStatus: ShieldStatus = m.ops
    ? heroValue >= 85
      ? "ok"
      : heroValue >= 70
        ? "warn"
        : "danger"
    : heroValue >= 95
      ? "ok"
      : heroValue >= 85
        ? "warn"
        : "danger";

  // Línea 1: volumen + revenue (sin ticket medio).
  const totalOrders = m.kpis.totalOrders;
  const revenueShort = formatEurCompact(m.kpis.totalRevenueEur);

  // Línea 2: handling vs transit (si hay ops) o SLA detalle (fallback).
  let line2Title: string;
  let line2Description: string;
  if (m.ops) {
    const handling = m.ops.avgHandlingDays.toFixed(1);
    const transit = m.ops.avgTransitDays.toFixed(1);
    line2Title = `Manipulación: ${handling}d (depto)`;
    line2Description = `Transporte: ${transit}d (TIPSA)`;
  } else {
    const avgDays = m.sla.avgDeliveryDays.toFixed(1);
    const slaExtras: string[] = [];
    if (m.sla.breachedCount > 0) slaExtras.push(`${m.sla.breachedCount} rotos`);
    if (m.sla.activeAtRisk > 0) slaExtras.push(`${m.sla.activeAtRisk} en riesgo`);
    line2Title = `SLA: ${avgDays}d entrega`;
    line2Description = slaExtras.join(" · ") || "Sin incidencias SLA";
  }

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
      id: "handling-transit",
      occurredAt: m.generatedAt,
      title: line2Title,
      description: line2Description,
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
