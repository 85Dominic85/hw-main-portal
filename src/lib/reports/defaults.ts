import { reportContentSchemaV1, type ReportContent } from "./schema";

/**
 * Construye un `ReportContent` inicial vacío para un nuevo borrador.
 * Zod se encarga de los defaults de cada sub-schema.
 */
export function buildEmptyContent(): ReportContent {
  return reportContentSchemaV1.parse({ _version: 1 });
}

/**
 * Parsea el `content` JSONB de un informe de forma tolerante.
 *
 * Usa `safeParse` en vez de `.parse()` para que un content malformado
 * (fila legacy, edición manual en BD, versión de schema futura) NO crashee
 * el viewer/editor ni haga 500 las rutas de export. Si falla, devuelve un
 * content vacío válido y deja rastro en logs.
 */
export function parseReportContent(raw: unknown): ReportContent {
  const parsed = reportContentSchemaV1.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  console.warn("[reports] content malformado, usando content vacío:", parsed.error.message);
  return buildEmptyContent();
}
