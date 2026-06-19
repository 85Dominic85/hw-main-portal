import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { reportContentSchemaV1, kpiSnapshotSchema } from "@/lib/reports/schema";
import { contentToMarkdown } from "@/lib/reports/to-markdown";
import { formatWeekLabel, parseWeekKey } from "@/lib/reports/iso-week";

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

  if (user.role !== "admin" && report.status !== "published") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const content = reportContentSchemaV1.parse(report.content ?? {});
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

  await db.insert(exportLog).values({
    userId: user.id,
    exportKind: "report_markdown",
    filters: { report_id: id, period_key: report.periodKey },
  });

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
