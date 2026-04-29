import { z } from "zod";

/**
 * Zod schema del response de la edge function `analytics-api`.
 * Coincide con `?endpoint=schema` del 2026-04-29.
 *
 * Si Guillermo cambia el contrato, este schema falla en parse y el
 * connector devuelve `Result.error` con detalle. La home y la pestaña
 * muestran estado neutro sin romper la app.
 */

const detailedItemSchema = z.object({
  count: z.number().int().nonnegative(),
  percent_of_total: z.number().min(0).max(100),
});

export const hwToolApiResponseSchema = z.object({
  generated_at: z.string(),
  schema_version: z.string(),
  filters: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
    technician: z.string().nullable(),
  }),
  principal: z.object({
    total_sessions: z.number().int().nonnegative(),
    breakdown: z.object({
      configuracion: z.number().int().nonnegative(),
      auditoria: z.number().int().nonnegative(),
      noshow: z.number().int().nonnegative(),
    }),
  }),
  detailed: z.object({
    config_ok: detailedItemSchema,
    config_pnp: detailedItemSchema,
    config_requires_2nd: detailedItemSchema,
    auditoria: detailedItemSchema,
    noshow: detailedItemSchema,
  }),
  additional: z.object({
    problems_in_configs: z.array(
      z.object({
        problem: z.string(),
        count: z.number().int().nonnegative(),
      }),
    ),
    equipment: z.object({
      own: z.object({
        count: z.number().int().nonnegative(),
        percent: z.number().min(0).max(100),
      }),
      external: z.object({
        count: z.number().int().nonnegative(),
        percent: z.number().min(0).max(100),
      }),
      total_items: z.number().int().nonnegative(),
    }),
  }),
});

export type HwToolApiResponse = z.infer<typeof hwToolApiResponseSchema>;

/** Schema del endpoint `?endpoint=health`. */
export const hwToolHealthSchema = z.object({
  status: z.literal("ok"),
  schema_version: z.string(),
  time: z.string(),
});
