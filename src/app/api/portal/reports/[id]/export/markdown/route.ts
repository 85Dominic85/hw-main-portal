import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { db, schema } from "@/lib/db";
import { kpiSnapshotSchema } from "@/lib/reports/schema";
import { parseReportContent } from "@/lib/reports/defaults";
import { contentToMarkdown } from "@/lib/reports/to-markdown";
import { formatWeekLabel, parseWeekKey } from "@/lib/reports/iso-week";

export const dynamic = "force-dynamic";

const { reports, exportLog } = schema;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);

  const report = rows[0];
  if (!report) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const content = parseReportContent(report.content);
  const snapshotResult = report.kpiSnapshot
    ? kpiSnapshotSchema.safeParse(report.kpiSnapshot)
    : null;
  const snapshot = snapshotResult?.success ? snapshotResult.data : null;

  const weekInfo =
    report.type === "weekly" && report.isoYear && report.isoWeek
      ? parseWeekKey(report.periodKey)
      : null;
  const periodLabel = weekInfo
    ? formatWeekLabel(weekInfo.isoYear, weekInfo.isoWeek)
    : report.periodKey;

  const markdown = contentToMarkdown(
    {
      title: report.title,
      periodLabel,
      globalStatus: report.globalStatus,
      publishedAt: report.publishedAt?.toISOString() ?? null,
    },
    content,
    snapshot,
  );

  const filename = `${report.periodKey}-informe.md`;

  // Audit log — best-effort, nunca debe romper la descarga.
  // En modo bypass el usuario sintético no existe en portal_users (FK
  // export_log_user_id_fkey, columna NOT NULL), así que se omite el log.
  if (!AUTH_BYPASS_ENABLED) {
    try {
      await db.insert(exportLog).values({
        userId: user.id,
        exportKind: "report_markdown",
        filters: { report_id: id, period_key: report.periodKey },
      });
    } catch (e) {
      console.error("[export/markdown] export_log insert failed", e);
    }
  }

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
