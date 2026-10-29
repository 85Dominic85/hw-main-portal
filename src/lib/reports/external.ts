import type { Report } from "@/lib/db/schema/reports";
import { kpiSnapshotSchema } from "./schema";
import { parseReportContent } from "./defaults";
import { contentToMarkdown } from "./to-markdown";
import { formatWeekLabel, parseWeekKey } from "./iso-week";

/**
 * Serialización de informes para la API de lectura externa
 * (`/api/external/reports`). Módulo puro → testeable sin BD.
 *
 * Decisión 2026-10-29: la API expone publicados y borradores (no archivados)
 * y el contenido completo, incluida la sección Performance.
 */

export const EXTERNAL_REPORT_STATUSES = ["published", "draft"] as const;

type ReportSummaryRow = Pick<
  Report,
  | "id"
  | "type"
  | "periodKey"
  | "isoYear"
  | "isoWeek"
  | "title"
  | "status"
  | "globalStatus"
  | "publishedAt"
  | "updatedAt"
>;

/** Etiqueta legible del periodo, igual que en los exports del portal. */
export function reportPeriodLabel(
  report: Pick<Report, "type" | "periodKey" | "isoYear" | "isoWeek">,
): string {
  const weekInfo =
    report.type === "weekly" && report.isoYear && report.isoWeek
      ? parseWeekKey(report.periodKey)
      : null;
  return weekInfo ? formatWeekLabel(weekInfo.isoYear, weekInfo.isoWeek) : report.periodKey;
}

export function toExternalReportSummary(row: ReportSummaryRow) {
  return {
    id: row.id,
    type: row.type,
    periodKey: row.periodKey,
    periodLabel: reportPeriodLabel(row),
    title: row.title,
    status: row.status,
    globalStatus: row.globalStatus,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Informe completo: metadatos + Markdown (con Performance) + contenido estructurado. */
export function toExternalReport(report: Report) {
  const content = parseReportContent(report.content);
  const snapshotResult = report.kpiSnapshot
    ? kpiSnapshotSchema.safeParse(report.kpiSnapshot)
    : null;
  const kpiSnapshot = snapshotResult?.success ? snapshotResult.data : null;
  const summary = toExternalReportSummary(report);

  const markdown = contentToMarkdown(
    {
      title: report.title,
      periodLabel: summary.periodLabel,
      globalStatus: report.globalStatus,
      publishedAt: summary.publishedAt,
    },
    content,
    kpiSnapshot,
    { showPerformance: true },
  );

  return { ...summary, markdown, content, kpiSnapshot };
}
