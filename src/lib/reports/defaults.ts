import { reportContentSchemaV1, type ReportContent } from "./schema";

/**
 * Construye un `ReportContent` inicial vacío para un nuevo borrador.
 * Zod se encarga de los defaults de cada sub-schema.
 */
export function buildEmptyContent(): ReportContent {
  return reportContentSchemaV1.parse({ _version: 1 });
}
