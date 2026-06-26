import { z } from "zod";

export const executiveSummaryRowSchema = z.object({
  id: z.string(),
  kpiKey: z.string(),
  label: z.string(),
  unit: z.string().optional(),
  // Texto libre para soportar valores ricos del informe Notion
  // ("~5.500-5.800 € (est.)", "84% (citas con requisitos, excl. PnP)").
  // La automatización los rellena con valores formateados; el admin puede editarlos.
  target: z.string().default(""),
  actual: z.string().default(""),
  // "Semana anterior": valor REAL del KPI en el periodo previo al informe
  // (lo rellena el autofill desde los conectores; editable a mano).
  // Conserva el nombre `delta` por compatibilidad con informes ya guardados.
  delta: z.string().default(""),
  // source: 'auto' = valor del conector; 'manual' = editado por admin
  source: z.enum(["auto", "manual"]).default("auto"),
  status: z.enum(["verde", "amarillo", "rojo", "neutral"]).default("neutral"),
  // Responsable del KPI (columna Owner del scorecard).
  owner: z.string().default(""),
  comment: z.string().default(""),
});

export const executiveSummarySchema = z.object({
  rows: z.array(executiveSummaryRowSchema).default([]),
});

export type ExecutiveSummaryRow = z.infer<typeof executiveSummaryRowSchema>;
export type ExecutiveSummary = z.infer<typeof executiveSummarySchema>;
