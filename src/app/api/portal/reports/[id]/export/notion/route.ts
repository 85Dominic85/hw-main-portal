import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { reportContentSchemaV1, kpiSnapshotSchema } from "@/lib/reports/schema";
import { contentToNotionMarkdown } from "@/lib/reports/to-notion-markdown";
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

  const rows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
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

  const markdown = contentToNotionMarkdown(
    {
      title: report.title,
      periodLabel,
      globalStatus: report.globalStatus,
      publishedAt: report.publishedAt?.toISOString() ?? null,
    },
    content,
    snapshot,
  );

  await db.insert(exportLog).values({
    userId: user.id,
    exportKind: "report_notion",
    filters: { report_id: id, period_key: report.periodKey },
  });

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
