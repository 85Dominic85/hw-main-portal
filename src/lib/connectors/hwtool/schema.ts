import { z } from "zod";

/**
 * Zod schema del response de la edge function `analytics-api` (v1.1.0).
 *
 * Cambios respecto a v1.0.0:
 *   - `filters.crm_test: boolean | null`
 *   - `additional.crm_test` ampliado:
 *       - `with_motivo`: cuántos CRM test tienen motivo escrito
 *       - `breakdown_by_type`: { configuracion, auditoria, noshow }
 *       - `motivos`: lista agregada [{ motivo, count }]
 *
 * Si Guillermo cambia el contrato, este schema falla en parse y el
 * connector devuelve `Result.error` con detalle. La home y la pestaña
 * muestran estado neutro sin romper la app.
 */

const detailedItemSchema = z.object({
  count: z.number().int().nonnegative(),
  percent_of_total: z.number().min(0).max(100),
});

const crmTestMotivoSchema = z.object({
  motivo: z.string(),
  count: z.number().int().nonnegative(),
});

const crmTestSchema = z.object({
  count: z.number().int().nonnegative(),
  percent_of_total: z.number().min(0).max(100),
  with_motivo: z.number().int().nonnegative(),
  breakdown_by_type: z.object({
    configuracion: z.number().int().nonnegative(),
    auditoria: z.number().int().nonnegative(),
    noshow: z.number().int().nonnegative(),
  }),
  motivos: z.array(crmTestMotivoSchema),
});

export const hwToolApiResponseSchema = z.object({
  generated_at: z.string(),
  schema_version: z.string(),
  filters: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
    technician: z.string().nullable(),
    crm_test: z.boolean().nullable().optional(),
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
    // crm_test es opcional para compat retro con v1.0.0.
    crm_test: crmTestSchema.optional(),
  }),
});

export type HwToolApiResponse = z.infer<typeof hwToolApiResponseSchema>;
export type HwToolCrmTestApi = z.infer<typeof crmTestSchema>;

/** Schema del endpoint `?endpoint=health`. */
export const hwToolHealthSchema = z.object({
  status: z.literal("ok"),
  schema_version: z.string(),
  time: z.string(),
});
