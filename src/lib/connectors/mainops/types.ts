/**
 * Tipos del connector MainOps — shape interno del portal.
 * Convención: camelCase. El mapper traduce el response API (snake_case)
 * a estos tipos.
 */

export type MainOpsPurchaseType =
  | "kit_digital"
  | "hardware_one_off"
  | "hardware_financiacion"
  | "transferencias_saas"
  | "otro";

export type MainOpsOrderStatus =
  | "nuevo"
  | "pendiente"
  | "enviado_proveedor"
  | "enviado"
  | "pagado"
  | "falta_informacion"
  | "bloqueado"
  | "completado";

export interface MainOpsKpis {
  totalOrders: number;
  totalRevenueEur: number;
  avgOrderValueEur: number;
  /** ratio 0..1 — convertirlo a porcentaje en UI multiplicando ×100 */
  completedRate: number;
}

export interface MainOpsComparison {
  prevTotalOrders: number;
  prevTotalRevenueEur: number;
  prevAvgOrderValueEur: number;
  prevCompletedRate: number;
}

export interface MainOpsTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  count: number;
  revenueEur: number;
}

export interface MainOpsBreakdownByPurchaseType {
  purchaseType: string;
  count: number;
  revenueEur: number;
}

export interface MainOpsBreakdownByStatus {
  status: string;
  count: number;
}

export interface MainOpsBreakdownByProduct {
  productName: string;
  totalQty: number;
  orderCount: number;
}

export interface MainOpsSlaWeek {
  weekStart: string; // YYYY-MM-DD
  count: number;
  avgDays: number;
  /** ratio 0..1 */
  onTimePct: number;
}

export interface MainOpsSla {
  totalDelivered: number;
  avgDeliveryDays: number;
  /** ratio 0..1 — multiplicar ×100 para mostrar */
  onTimePct: number;
  breachedCount: number;
  activeAtRisk: number;
  byWeek: MainOpsSlaWeek[];
}

export interface MainOpsRecentOrder {
  operationId: string;
  createdAt: Date;
  customerName: string;
  venueName: string | null;
  purchaseType: MainOpsPurchaseType | null;
  amountEur: number | null;
  status: MainOpsOrderStatus;
  trackingNumber: string | null;
}

/** Punto semanal del throughput operativo (ops). */
export interface MainOpsThroughputWeek {
  weekStart: string; // YYYY-MM-DD
  created: number;
  shipped: number;
  delivered: number;
}

/**
 * Bloque "Actividad operativa" añadido por MainOps el 2026-04-30.
 * Métricas que separan lo que controla el depto (handling, on_time_shipping)
 * de lo que depende del transportista (transit). Opt-in: si la API revierte,
 * el portal hace fallback al SLA tradicional.
 */
export interface MainOpsOps {
  totalShipped: number;
  totalCompleted: number;
  /** Días promedio created → shipped (lo que controla el depto). */
  avgHandlingDays: number;
  /** Días promedio shipped → delivered (transportista, no controlado). */
  avgTransitDays: number;
  /** ratio 0..1 — multiplicar ×100 para mostrar. % envíos en ≤5 días. */
  onTimeShippingPct: number;
  throughputByWeek: MainOpsThroughputWeek[];
  /** Pedidos status='bloqueado' creados en el periodo (no penaliza al depto). */
  blockedCount: number;
  /** Pedidos SaaS/otro completados, excluidos del SLA físico (transparencia). */
  excludedAdmin: number;
}

export interface MainOpsMetrics {
  generatedAt: Date;
  range: { from: Date; to: Date };
  kpis: MainOpsKpis;
  comparison: MainOpsComparison | null;
  timeSeries: {
    ordersByDate: MainOpsTimeSeriesPoint[];
  };
  breakdowns: {
    byPurchaseType: MainOpsBreakdownByPurchaseType[];
    byStatus: MainOpsBreakdownByStatus[];
    byProduct: MainOpsBreakdownByProduct[];
  };
  sla: MainOpsSla;
  recentOrders: MainOpsRecentOrder[];
  /** Solo presente si la API devuelve `ops` (added 2026-04-30). */
  ops: MainOpsOps | null;
}

export interface MainOpsPeriodFilter {
  from?: Date;
  to?: Date;
  /** Filtra agregados y recent_orders. SLA siempre global. */
  purchaseType?: MainOpsPurchaseType | "all";
  /** 1..50, default 10 */
  recentLimit?: number;
}
