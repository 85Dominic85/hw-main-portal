import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { NewReportWizard } from "@/components/reports/new-report-wizard";
import { currentIsoWeekRange } from "@/lib/reports/iso-week";

export default async function NewReportPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/reports");

  const currentWeek = currentIsoWeekRange();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo informe</h1>
        <p className="text-sm text-muted-foreground">
          Elige el tipo y periodo del informe.
        </p>
      </div>
      <NewReportWizard
        defaultIsoYear={currentWeek.isoYear}
        defaultIsoWeek={currentWeek.isoWeek}
      />
    </div>
  );
}
