import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/kpi/stat-card";
import { PieChartCard, type PieChartSlice } from "@/components/charts/pie-chart-card";
import {
  HwToolPeriodSelector,
  periodToFilter,
  type HwToolPeriod,
} from "@/components/shared/hwtool-period-selector";
import { getHwToolSummary } from "@/server/queries/hwtool";
import { colorForProblem } from "@/lib/connectors/hwtool";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

const VALID_PERIODS: HwToolPeriod[] = ["today", "7d", "30d", "month"];

export default async function HwToolPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodParam = params.period as HwToolPeriod | undefined;
  const period: HwToolPeriod = VALID_PERIODS.includes(periodParam as HwToolPeriod)
    ? (periodParam as HwToolPeriod)
    : "month";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HW Tool</h1>
          <p className="text-sm text-muted-foreground">
            Configuraciones, auditorías y no-shows del periodo seleccionado.
          </p>
        </div>
        <HwToolPeriodSelector />
      </div>

      <Suspense
        key={period}
        fallback={<HwToolDashboardSkeleton />}
      >
        <HwToolDashboard period={period} />
      </Suspense>
    </div>
  );
}

async function HwToolDashboard({ period }: { period: HwToolPeriod }) {
  const filter = periodToFilter(period);
  const result = await getHwToolSummary(filter);

  if (!result.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API HW Tool no disponible</CardTitle>
          <CardDescription className="text-status-danger">{result.error}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Reintenta más tarde o pulsa &quot;Actualizar&quot; en la barra superior. Si persiste,
          comprueba que la edge function <code className="font-mono">analytics-api</code>{" "}
          está respondiendo y que las variables{" "}
          <code className="font-mono">HWTOOL_ANALYTICS_API_*</code> están configuradas.
        </CardContent>
      </Card>
    );
  }

  const m = result.data;
  const successRateStatus = m.successRateFirstTry >= 80 ? "ok" : m.successRateFirstTry >= 60 ? "warn" : "danger";
  const noshowRate = m.principal.totalSessions > 0
    ? (m.principal.noshow / m.principal.totalSessions) * 100
    : 0;
  const noshowStatus = noshowRate <= 10 ? "ok" : noshowRate <= 20 ? "warn" : "danger";

  const problemSlices: PieChartSlice[] = m.problems.map((p) => ({
    key: p.key,
    label: p.label,
    value: p.count,
    color: colorForProblem(p.key),
  }));

  const equipmentSlices: PieChartSlice[] = [
    {
      key: "own",
      label: "Propio",
      value: m.equipment.own.count,
      color: "hsl(var(--status-ok))",
    },
    {
      key: "external",
      label: "Externo",
      value: m.equipment.external.count,
      color: "hsl(var(--status-danger))",
    },
  ];

  const periodLabel = m.filters.from && m.filters.to
    ? `${m.filters.from.toISOString().slice(0, 10)} → ${m.filters.to.toISOString().slice(0, 10)}`
    : "todo el histórico";

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Periodo: <span className="font-mono">{periodLabel}</span> · Generado{" "}
        <time dateTime={m.generatedAt.toISOString()}>
          {m.generatedAt.toLocaleString("es-ES")}
        </time>
      </p>

      <section
        aria-label="KPIs principales"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          title="Sesiones totales"
          value={m.principal.totalSessions.toLocaleString("es-ES")}
          description={`${m.principal.configuracion} config · ${m.principal.auditoria} audit · ${m.principal.noshow} no-show`}
        />
        <StatCard
          title="% éxito a 1ª"
          value={`${m.successRateFirstTry}%`}
          description={`${m.detailed.configOk.count + m.detailed.configPnp.count} de ${m.principal.configuracion} configs`}
          status={successRateStatus}
        />
        <StatCard
          title="% PnP"
          value={`${m.detailed.configPnp.percentOfTotal}%`}
          description={`${m.detailed.configPnp.count} configs plug-n-play`}
        />
        <StatCard
          title="% req. 2ª config"
          value={`${m.secondConfigRate}%`}
          description={`${m.detailed.configRequires2nd.count} sesiones extra`}
          status={m.secondConfigRate <= 15 ? "ok" : m.secondConfigRate <= 25 ? "warn" : "danger"}
        />
        <StatCard
          title="% no-show"
          value={`${noshowRate.toFixed(1)}%`}
          description={`${m.principal.noshow} sesiones perdidas`}
          status={noshowStatus}
        />
      </section>

      <section
        aria-label="Distribuciones"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <PieChartCard
          title="Distribución de problemas"
          description="Categorías reportadas en las configuraciones del periodo"
          data={problemSlices}
          showCenterTotal
          centerLabel="incidencias"
        />
        <PieChartCard
          title="Origen del equipamiento"
          description={`${m.equipment.totalItems} items registrados`}
          data={equipmentSlices}
          showCenterTotal
          centerLabel="items"
        />
      </section>
    </div>
  );
}

function HwToolDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </div>
  );
}
