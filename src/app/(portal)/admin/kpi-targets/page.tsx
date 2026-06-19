import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { KpiDefinitionsTable } from "@/components/admin/kpi-definitions-table";
import { asc } from "drizzle-orm";

const { reportKpiDefinitions } = schema;

export default async function KpiTargetsPage() {
  await requireAdmin();

  const definitions = await db
    .select()
    .from(reportKpiDefinitions)
    .orderBy(asc(reportKpiDefinitions.sectionKey), asc(reportKpiDefinitions.label));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Targets de KPI</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de KPIs del informe semanal — targets, umbrales de alerta y datos de origen.
        </p>
      </div>

      <KpiDefinitionsTable definitions={definitions} />
    </div>
  );
}
