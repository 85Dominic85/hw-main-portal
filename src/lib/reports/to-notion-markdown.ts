import { contentToMarkdown } from "./to-markdown";
import type { ReportContent, KpiSnapshot } from "./schema";

/**
 * Variante Notion del export Markdown.
 * Añade separadores horizontales (--- → bloque Divisor en Notion)
 * entre secciones para que el pegado sea visualmente limpio.
 */
export function contentToNotionMarkdown(
  meta: {
    title: string;
    periodLabel: string;
    globalStatus: string | null;
    publishedAt: string | null;
  },
  content: ReportContent,
  snapshot: KpiSnapshot | null,
): string {
  const md = contentToMarkdown(meta, content, snapshot);

  // Insertar divisor antes de cada sección de nivel 2 (##)
  // Notion renderiza "---" como un bloque Divisor visual
  return md.replace(/\n(## )/g, "\n\n---\n\n$1");
}
