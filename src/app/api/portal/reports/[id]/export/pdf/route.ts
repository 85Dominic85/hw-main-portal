import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { db, schema } from "@/lib/db";
import { kpiSnapshotSchema } from "@/lib/reports/schema";
import { parseReportContent } from "@/lib/reports/defaults";
import { formatWeekLabel, parseWeekKey } from "@/lib/reports/iso-week";
import { ReportPdfDocument } from "@/components/reports/report-pdf-document";

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

  const props = {
    report: {
      title: report.title,
      periodLabel,
      globalStatus: report.globalStatus,
      publishedAt: report.publishedAt?.toISOString() ?? null,
    },
    content,
    snapshot,
  };

  // Import dinámico para que @react-pdf/renderer no crashee el Lambda en cold-start.
  const { renderToBuffer } = await import("@react-pdf/renderer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(ReportPdfDocument(props) as any);

  const filename = `${report.periodKey}-informe.pdf`;

  // Audit log — best-effort, nunca debe romper la descarga.
  // En modo bypass el usuario sintético no existe en portal_users (FK
  // export_log_user_id_fkey, columna NOT NULL), así que se omite el log.
  if (!AUTH_BYPASS_ENABLED) {
    try {
      await db.insert(exportLog).values({
        userId: user.id,
        exportKind: "report_pdf",
        filters: { report_id: id, period_key: report.periodKey },
      });
    } catch (e) {
      console.error("[export/pdf] export_log insert failed", e);
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
