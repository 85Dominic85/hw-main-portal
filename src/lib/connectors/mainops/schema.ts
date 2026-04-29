import { z } from "zod";

/**
 * Zod schema del response de `GET /api/external/metrics` de MainOps.
 * Coincide con el contrato `docs/HW_MAIN_PORTAL_API.md` del repo
 * `qamarero/hw-SellGear-platform`.
 *
 * Si MainOps cambia el contrato, este schema falla en parse y el
 * connector devuelve `Result.error` con detalle. El banner / pestaña
 * muestran estado neutro sin romper la app.
 */

const purchaseTypeSchema = z.enum([
  "kit_digital",
  "hardware_one_off",
  "hardware_financiacion",
  "transferencias_saas",
  "otro",
]);

const orderStatusSchema = z.enum([
  "nuevo",
  "pendiente",
  "enviado_proveedor",
  "enviado",
  "pagado",
  "falta_informacion",
  "bloqueado",
  "completado",
]);

export const mainOpsApiResponseSchema = z.object({
  generated_at: z.string(),
  range: z.object({
    from: z.string(),
    to: z.string(),
  }),
  kpis: z.object({
    total_orders: z.number().int().nonnegative(),
    total_revenue: z.number().nonnegative(),
    avg_order_value: z.number().nonnegative(),
    completed_rate: z.number().min(0).max(1),
  }),
  comparison: z
    .object({
      prev_total_orders: z.number().nonnegative(),
      prev_total_revenue: z.number().nonnegative(),
      prev_avg_order_value: z.number().nonnegative(),
      prev_completed_rate: z.number().min(0).max(1),
    })
    .nullable(),
  time_series: z.object({
    orders_by_date: z.array(
      z.object({
        date: z.string(),
        count: z.number().int().nonnegative(),
        revenue: z.number().nonnegative(),
      }),
    ),
  }),
  breakdowns: z.object({
    by_purchase_type: z.array(
      z.object({
        purchase_type: z.string(),
        count: z.number().int().nonnegative(),
        revenue: z.number().nonnegative(),
      }),
    ),
    by_status: z.array(
      z.object({
        status: z.string(),
        count: z.number().int().nonnegative(),
      }),
    ),
    by_product: z.array(
      z.object({
        product_name: z.string(),
        total_qty: z.number().int().nonnegative(),
        order_count: z.number().int().nonnegative(),
      }),
    ),
  }),
  sla: z.object({
    total_delivered: z.number().int().nonnegative(),
    avg_delivery_days: z.number().nonnegative(),
    on_time_pct: z.number().min(0).max(1),
    breached_count: z.number().int().nonnegative(),
    active_at_risk: z.number().int().nonnegative(),
    sla_by_week: z.array(
      z.object({
        week_start: z.string(),
        count: z.number().int().nonnegative(),
        avg_days: z.number().nonnegative(),
        on_time_pct: z.number().min(0).max(1),
      }),
    ),
  }),
  recent_orders: z.array(
    z.object({
      operation_id: z.string(),
      created_at: z.string(),
      customer_name: z.string(),
      venue_name: z.string().nullable(),
      purchase_type: purchaseTypeSchema.nullable(),
      amount: z.number().nullable(),
      status: orderStatusSchema,
      tracking_number: z.string().nullable(),
    }),
  ),
});

export type MainOpsApiResponse = z.infer<typeof mainOpsApiResponseSchema>;
