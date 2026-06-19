import { z } from "zod";

const sourceHealthSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  fetchedAt: z.string(), // ISO string
});

const kpiSnapshotEntrySchema = z.object({
  key: z.string(),
  value: z.number().nullable(),
  unit: z.string().optional(),
  source: z.enum(["mainops", "hwtool", "hsm", "manual"]),
});

export const kpiSnapshotSchema = z.object({
  version: z.literal(1),
  frozenAt: z.string(), // ISO string
  periodFrom: z.string(),
  periodTo: z.string(),
  sourceHealth: z.object({
    mainops: sourceHealthSchema,
    hwtool: sourceHealthSchema,
    hsm: sourceHealthSchema,
  }),
  entries: z.array(kpiSnapshotEntrySchema),
});

export type KpiSnapshot = z.infer<typeof kpiSnapshotSchema>;
export type KpiSnapshotEntry = z.infer<typeof kpiSnapshotEntrySchema>;
export type SourceHealth = z.infer<typeof sourceHealthSchema>;
