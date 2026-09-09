import { z } from "zod";

import { tiptapDocSchema } from "@/lib/reports/schema";
import { LOG_ENTRY_STATUSES } from "@/lib/db/schema/log-entries";
import { MAX_TAGS_PER_ENTRY } from "@/lib/bitacora/tags";

/**
 * Zod schemas de la bitácora.
 *
 * Las etiquetas se validan como cadenas libres y se NORMALIZAN en el server
 * action (`normalizeTags`), no aquí: el usuario puede escribir "#KDS" y eso es
 * válido, solo hay que convertirlo. Rechazar aquí lo que se puede arreglar
 * sería fricción gratuita.
 */

/** `YYYY-MM-DD`, y que sea una fecha real (rechaza 2026-02-31). */
const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Esa fecha no existe");

const titleSchema = z
  .string()
  .trim()
  .max(140, "El título no puede pasar de 140 caracteres")
  .optional()
  .transform((v) => (v ? v : null));

const clientSchema = z
  .string()
  .trim()
  .max(120, "El nombre del cliente no puede pasar de 120 caracteres")
  .optional()
  .transform((v) => (v ? v : null));

const statusSchema = z
  .enum(LOG_ENTRY_STATUSES)
  .nullish()
  .transform((v) => v ?? null);

const tagsSchema = z
  .array(z.string().max(60))
  .max(MAX_TAGS_PER_ENTRY * 3, "Demasiadas etiquetas")
  .optional()
  .transform((v) => v ?? []);

export const createLogEntrySchema = z.object({
  entryDate: dateKeySchema,
  title: titleSchema,
  body: tiptapDocSchema,
  tags: tagsSchema,
  client: clientSchema,
  status: statusSchema,
  highlight: z.boolean().optional().transform((v) => v ?? false),
});

export const updateLogEntrySchema = createLogEntrySchema.extend({
  id: z.string().uuid("Id de entrada no válido"),
});

export const deleteLogEntrySchema = z.object({
  id: z.string().uuid("Id de entrada no válido"),
});

export type CreateLogEntryInput = z.infer<typeof createLogEntrySchema>;
export type UpdateLogEntryInput = z.infer<typeof updateLogEntrySchema>;

/** Filtros de la vista `/bitacora`. Todos opcionales; se leen de la URL. */
export const logEntryFiltersSchema = z.object({
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  author: z.string().trim().toLowerCase().max(200).optional(),
  tag: z.string().trim().max(60).optional(),
  q: z.string().trim().max(200).optional(),
});

export type LogEntryFilters = z.infer<typeof logEntryFiltersSchema>;
