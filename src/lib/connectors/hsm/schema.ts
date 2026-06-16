import { z } from "zod";

/**
 * Zod schemas del response de HSM. Replica el contrato definido en
 * `docs/connectors/hsm-endpoint-spec.md` (sección 5).
 *
 * Toleramos campos extra (Zod ignora silenciosamente lo no declarado), así
 * que si HSM añade más métricas en el futuro, el portal sigue funcionando
 * sin romper. La inversa NO es cierta: si HSM **quita** un campo declarado
 * required, el `safeParse` falla y el portal cae con `error` legible.
 */

const incidentByPrioritySchema = z.object({
  priority: z.string(),
  count: z.coerce.number().int().nonnegative(),
});

const agingPointSchema = z.object({
  bucket: z.enum(["lt_1d", "1_3d", "3_7d", "gt_7d"]),
  count: z.coerce.number().int().nonnegative(),
});

const topProviderSchema = z.object({
  provider_id: z.string(),
  provider_name: z.string(),
  rma_count: z.coerce.number().int().nonnegative(),
  // Sin .max(100): defensivo ante bugs upstream en queries de ratio.
  // Si HSM emite >100 por una division mal calculada, no rompemos el shield.
  success_rate_pct: z.coerce.number().nonnegative(),
  avg_turnaround_days: z.coerce.number().nonnegative().nullable(),
});

// Carga oculta — consultas rápidas in-situ (HSM v1.1.0+).
const quickConsultationByTechnicianSchema = z.object({
  name: z.string(),
  count: z.coerce.number().int().nonnegative(),
  total_minutes: z.coerce.number().int().nonnegative(),
});

const quickConsultationsCurrentSchema = z.object({
  count: z.coerce.number().int().nonnegative(),
  total_minutes: z.coerce.number().int().nonnegative(),
  avg_minutes: z.coerce.number().nonnegative().nullable(),
  by_technician: z.array(quickConsultationByTechnicianSchema),
  conversion_rate_pct: z.coerce.number().nonnegative(),
});

const quickConsultationsPreviousSchema = z.object({
  count: z.coerce.number().int().nonnegative(),
  total_minutes: z.coerce.number().int().nonnegative(),
});

const currentSchema = z.object({
  open_incidents: z.coerce.number().int().nonnegative(),
  active_rmas: z.coerce.number().int().nonnegative(),
  // Sin .max(100) en los pcts: defensivo ante bugs upstream en queries de
  // ratio. Si HSM emite >100 por una division mal calculada, no rompemos el
  // shield. La UI clampea visualmente lo que exceda en mappers / formatters.
  sla_compliance_pct: z.coerce.number().nonnegative(),
  overdue_count: z.coerce.number().int().nonnegative(),
  avg_resolution_hours: z.coerce.number().nonnegative().nullable(),
  reopen_rate_pct: z.coerce.number().nonnegative(),
  avg_rma_turnaround_days: z.coerce.number().nonnegative().nullable(),
  critical_in_sla_pct: z.coerce.number().nonnegative().nullable(),
  throughput_ratio: z.coerce.number().nonnegative(),
  incidents_by_priority: z.array(incidentByPrioritySchema),
  aging_distribution: z.array(agingPointSchema),
  top_providers: z.array(topProviderSchema),
  // Opcional para retro-compat con schema_version=1.0.0 (HSM antes de v0.7).
  quick_consultations: quickConsultationsCurrentSchema.optional(),
});

const previousSchema = z.object({
  sla_compliance_pct: z.coerce.number().nonnegative(),
  avg_resolution_hours: z.coerce.number().nonnegative().nullable(),
  reopen_rate_pct: z.coerce.number().nonnegative(),
  open_incidents_at_close: z.coerce.number().int().nonnegative(),
  quick_consultations: quickConsultationsPreviousSchema.optional(),
});

const filtersSchema = z.object({
  from: z.string(),
  to: z.string(),
  prev_from: z.string(),
  prev_to: z.string(),
});

export const hsmApiResponseSchema = z.object({
  generated_at: z.string(),
  schema_version: z.string(),
  filters: filtersSchema,
  current: currentSchema,
  previous: previousSchema,
});

export type HsmApiResponse = z.infer<typeof hsmApiResponseSchema>;
export type HsmApiResponseCurrent = z.infer<typeof currentSchema>;
export type HsmApiResponsePrevious = z.infer<typeof previousSchema>;
