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
    // Doc canónico dice ratio 0-1 pero la implementación real devuelve 0-100.
    // Relajamos a 0-100 y el mapper normaliza a ratio interno.
    completed_rate: z.number().min(0).max(100),
  }),
  comparison: z
    .object({
      prev_total_orders: z.number().nonnegative(),
      prev_total_revenue: z.number().nonnegative(),
      prev_avg_order_value: z.number().nonnegative(),
      prev_completed_rate: z.number().min(0).max(100),
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
    on_time_pct: z.number().min(0).max(100),
    breached_count: z.number().int().nonnegative(),
    active_at_risk: z.number().int().nonnegative(),
    sla_by_week: z.array(
      z.object({
        week_start: z.string(),
        count: z.number().int().nonnegative(),
        avg_days: z.number().nonnegative(),
        on_time_pct: z.number().min(0).max(100),
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
  /**
   * Bloque opcional añadido por MainOps el 2026-04-30. KPIs operativos del
   * depto Hardware (handling vs transit, throughput, etc.). Si no viene,
   * el portal hace fallback al SLA tradicional sin romperse.
   *
   * `on_time_shipping_pct` viene en escala 0-100 igual que el resto de
   * `*_pct` y `*_rate` del endpoint (el doc canónico decía 0-1, pero la
   * implementación real es 0-100 — el mapper normaliza).
   */
  ops: z
    .object({
      total_shipped: z.number().int().nonnegative(),
      total_completed: z.number().int().nonnegative(),
      avg_handling_days: z.number().nonnegative(),
      avg_transit_days: z.number().nonnegative(),
      on_time_shipping_pct: z.number().min(0).max(100),
      throughput_by_week: z.array(
        z.object({
          week_start: z.string(),
          created: z.number().int().nonnegative(),
          shipped: z.number().int().nonnegative(),
          delivered: z.number().int().nonnegative(),
        }),
      ),
      blocked_count: z.number().int().nonnegative(),
      excluded_admin: z.number().int().nonnegative(),
    })
    .optional(),
});

export type MainOpsApiResponse = z.infer<typeof mainOpsApiResponseSchema>;
