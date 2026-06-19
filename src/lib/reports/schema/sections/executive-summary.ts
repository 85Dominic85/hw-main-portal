import { z } from "zod";

export const executiveSummaryRowSchema = z.object({
  id: z.string(),
  kpiKey: z.string(),
  label: z.string(),
  unit: z.string().optional(),
  target: z.number().nullable().default(null),
  actual: z.number().nullable().default(null),
  // source: 'auto' = valor del conector; 'manual' = editado por admin
  source: z.enum(["auto", "manual"]).default("auto"),
  status: z.enum(["verde", "amarillo", "rojo", "neutral"]).default("neutral"),
  comment: z.string().default(""),
});

export const executiveSummarySchema = z.object({
  rows: z.array(executiveSummaryRowSchema).default([]),
});

export type ExecutiveSummaryRow = z.infer<typeof executiveSummaryRowSchema>;
export type ExecutiveSummary = z.infer<typeof executiveSummarySchema>;
