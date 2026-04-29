import type { MainOpsApiResponse } from "./schema";
import type {
  MainOpsMetrics,
  MainOpsOrderStatus,
  MainOpsPurchaseType,
} from "./types";

/**
 * Convierte el response crudo de la API (snake_case + ISO strings) al
 * shape interno del portal (camelCase + Date).
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
      completedRate: raw.kpis.completed_rate,
    },
    comparison: raw.comparison
      ? {
          prevTotalOrders: raw.comparison.prev_total_orders,
          prevTotalRevenueEur: raw.comparison.prev_total_revenue,
          prevAvgOrderValueEur: raw.comparison.prev_avg_order_value,
          prevCompletedRate: raw.comparison.prev_completed_rate,
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
      onTimePct: raw.sla.on_time_pct,
      breachedCount: raw.sla.breached_count,
      activeAtRisk: raw.sla.active_at_risk,
      byWeek: raw.sla.sla_by_week.map((w) => ({
        weekStart: w.week_start,
        count: w.count,
        avgDays: w.avg_days,
        onTimePct: w.on_time_pct,
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
  };
}
