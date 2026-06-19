import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit2, Download, FileDown, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getReportById } from "@/server/queries/reports";
import { ReportViewer } from "@/components/reports/report-viewer";
import { CopyNotionButton } from "@/components/reports/copy-notion-button";
import { reportContentSchemaV1, kpiSnapshotSchema } from "@/lib/reports/schema";
import { formatWeekLabel, parseWeekKey } from "@/lib/reports/iso-week";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportViewPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  const report = await getReportById(id, isAdmin ? "admin" : "viewer");
  if (!report) notFound();

  const content = reportContentSchemaV1.parse(report.content ?? {});
  const snapshot = report.kpiSnapshot
    ? kpiSnapshotSchema.safeParse(report.kpiSnapshot)
    : null;

  const weekInfo =
    report.type === "weekly" && report.isoYear && report.isoWeek
      ? parseWeekKey(report.periodKey)
      : null;
  const periodLabel = weekInfo
    ? formatWeekLabel(weekInfo.isoYear, weekInfo.isoWeek)
    : report.periodKey;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{report.title}</h1>
              {report.status === "draft" && (
                <Badge variant="outline" className="text-muted-foreground">
                  Borrador
                </Badge>
              )}
              {report.globalStatus && (
                <span
                  className={
                    report.globalStatus === "verde"
                      ? "text-status-ok"
                      : report.globalStatus === "amarillo"
                        ? "text-status-warn"
                        : "text-status-danger"
                  }
                >
                  ●
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && report.status === "draft" && (
            <Button asChild variant="outline">
              <Link href={`/reports/${id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          {report.status === "published" && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/portal/reports/${id}/export/markdown`} download>
                  <Download className="mr-2 h-4 w-4" />
                  Markdown
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/portal/reports/${id}/export/pdf`} download>
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </a>
              </Button>
              <CopyNotionButton reportId={id} />
            </>
          )}
        </div>
      </div>

      {/* Contenido del informe */}
      <ReportViewer
        report={{
          id: report.id,
          title: report.title,
          type: report.type,
          periodKey: report.periodKey,
          periodLabel,
          globalStatus: report.globalStatus,
          status: report.status,
          publishedAt: report.publishedAt?.toISOString() ?? null,
        }}
        content={content}
        snapshot={snapshot?.success ? snapshot.data : null}
      />
    </div>
  );
}
