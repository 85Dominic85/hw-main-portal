import type { MainOpsApiResponse } from "./schema";
import type {
  MainOpsMetrics,
  MainOpsOps,
  MainOpsOrderStatus,
  MainOpsPurchaseType,
} from "./types";

/**
 * Normaliza un valor que la API devuelve como porcentaje (0-100) a ratio (0-1).
 *
 * Contexto: el doc canónico `HW_MAIN_PORTAL_API.md` declara estos campos como
 * "ratio 0-1", pero la implementación real (29-04-2026) devuelve `55.2`, `100`,
 * `34.4`... → claramente 0-100. Aceptamos ambos para no romper si MainOps
 * arregla la implementación. Si v > 1, asumimos 0-100; si v ≤ 1, ya es ratio.
 *
 * Caso degenerado: v exactamente 1 podría ser "100%" (en escala 0-1) o "1%"
 * (en escala 0-100). Asumimos lo primero (más probable: completed_rate=1.0
 * significa 100%).
 */
function normalizeRate(value: number): number {
  return value > 1 ? value / 100 : value;
}

/**
 * Convierte el response crudo de la API (snake_case + ISO strings) al
 * shape interno del portal (camelCase + Date).
 *
 * Los campos `*_pct` y `*_rate` se normalizan a ratio 0-1 internamente
 * (el banner / pestaña los multiplican por 100 al renderizar).
 */
export function mapMainOpsResponse(raw: MainOpsApiResponse): MainOpsMetrics {
  return {
    generatedAt: new Date(raw.generated_at),
    range: {
      from: new Date(raw.range.from),
      to: new Date(raw.range.to),
    },
    kpis: {
      totalOrders: raw.kpis.total_orders,
      totalRevenueEur: raw.kpis.total_revenue,
      avgOrderValueEur: raw.kpis.avg_order_value,
      completedRate: normalizeRate(raw.kpis.completed_rate),
    },
    comparison: raw.comparison
      ? {
          prevTotalOrders: raw.comparison.prev_total_orders,
          prevTotalRevenueEur: raw.comparison.prev_total_revenue,
          prevAvgOrderValueEur: raw.comparison.prev_avg_order_value,
          prevCompletedRate: normalizeRate(raw.comparison.prev_completed_rate),
        }
      : null,
    timeSeries: {
      ordersByDate: raw.time_series.orders_by_date.map((p) => ({
        date: p.date,
        count: p.count,
        revenueEur: p.revenue,
      })),
    },
    breakdowns: {
      byPurchaseType: raw.breakdowns.by_purchase_type.map((b) => ({
        purchaseType: b.purchase_type,
        count: b.count,
        revenueEur: b.revenue,
      })),
      byStatus: raw.breakdowns.by_status.map((b) => ({
        status: b.status,
        count: b.count,
      })),
      byProduct: raw.breakdowns.by_product.map((b) => ({
        productName: b.product_name,
        totalQty: b.total_qty,
        orderCount: b.order_count,
      })),
    },
    sla: {
      totalDelivered: raw.sla.total_delivered,
      avgDeliveryDays: raw.sla.avg_delivery_days,
      onTimePct: normalizeRate(raw.sla.on_time_pct),
      breachedCount: raw.sla.breached_count,
      activeAtRisk: raw.sla.active_at_risk,
      byWeek: raw.sla.sla_by_week.map((w) => ({
        weekStart: w.week_start,
        count: w.count,
        avgDays: w.avg_days,
        onTimePct: normalizeRate(w.on_time_pct),
      })),
    },
    recentOrders: raw.recent_orders.map((o) => ({
      operationId: o.operation_id,
      createdAt: new Date(o.created_at),
      customerName: o.customer_name,
      venueName: o.venue_name,
      purchaseType: o.purchase_type as MainOpsPurchaseType | null,
      amountEur: o.amount,
      status: o.status as MainOpsOrderStatus,
      trackingNumber: o.tracking_number,
    })),
    ops: mapOps(raw.ops),
  };
}

/**
 * Mapea el bloque opcional `ops` (snake_case → camelCase).
 * Devuelve `null` si la API no lo incluye (compat retro pre-2026-04-30).
 *
 * `on_time_shipping_pct` se normaliza con `normalizeRate` igual que el resto
 * de campos `*_pct` (la API devuelve 0-100 a pesar de que el doc dice 0-1).
 */
function mapOps(raw: MainOpsApiResponse["ops"]): MainOpsOps | null {
  if (!raw) return null;
  return {
    totalShipped: raw.total_shipped,
    totalCompleted: raw.total_completed,
    avgHandlingDays: raw.avg_handling_days,
    avgTransitDays: raw.avg_transit_days,
    onTimeShippingPct: normalizeRate(raw.on_time_shipping_pct),
    throughputByWeek: raw.throughput_by_week.map((w) => ({
      weekStart: w.week_start,
      created: w.created,
      shipped: w.shipped,
      delivered: w.delivered,
    })),
    blockedCount: raw.blocked_count,
    excludedAdmin: raw.excluded_admin,
  };
}
