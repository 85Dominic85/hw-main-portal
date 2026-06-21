import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getReportById } from "@/server/queries/reports";
import { ReportEditor } from "@/components/reports/report-editor";
import { parseReportContent } from "@/lib/reports/defaults";
import { formatWeekLabel, parseWeekKey } from "@/lib/reports/iso-week";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportEditPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user?.role !== "admin") redirect(`/reports/${id}`);

  const report = await getReportById(id, "admin");
  if (!report) notFound();
  if (report.status !== "draft") redirect(`/reports/${id}`);

  const content = parseReportContent(report.content);

  const weekInfo =
    report.type === "weekly" && report.isoYear && report.isoWeek
      ? parseWeekKey(report.periodKey)
      : null;
  const periodLabel = weekInfo
    ? formatWeekLabel(weekInfo.isoYear, weekInfo.isoWeek)
    : report.periodKey;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{report.title}</h1>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
      </div>

      <ReportEditor
        report={{
          id: report.id,
          type: report.type,
          periodKey: report.periodKey,
          periodLabel,
          title: report.title,
          globalStatus: report.globalStatus,
          periodFrom: report.periodFrom,
          periodTo: report.periodTo,
        }}
        initialContent={content}
        currentUserId={user.id}
      />
    </div>
  );
}
