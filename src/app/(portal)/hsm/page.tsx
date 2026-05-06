import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/kpi/stat-card";
import { PieChartCard, type PieChartSlice } from "@/components/charts/pie-chart-card";
import { BarChartCard, type BarChartSeries } from "@/components/charts/bar-chart-card";
import { HsmPeriodSelector } from "@/components/shared/hsm-period-selector";
import { getHsmSummary } from "@/server/queries/hsm";
import {
  colorForPriority,
  labelForPriority,
  labelForAging,
} from "@/lib/connectors/hsm";
import {
  HSM_DEFAULT_PERIOD,
  isValidPeriod,
  periodToFilter,
  type HsmPeriod,
} from "@/lib/hsm/period";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function HsmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period: HsmPeriod = isValidPeriod(params.period)
    ? params.period
    : HSM_DEFAULT_PERIOD;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HSM</h1>
          <p className="text-sm text-muted-foreground">
            Soporte hardware: incidencias, SLA, RMAs y proveedores del periodo seleccionado.
          </p>
        </div>
        <HsmPeriodSelector />
      </div>

      <Suspense key={period} fallback={<HsmDashboardSkeleton />}>
        <HsmDashboard period={period} />
      </Suspense>
    </div>
  );
}

async function HsmDashboard({ period }: { period: HsmPeriod }) {
  const filter = periodToFilter(period);
  const result = await getHsmSummary(filter);

  if (!result.ok) {
    const isUnconfigured = result.error.startsWith("Conectando con HSM");
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {isUnconfigured ? "Conectando con HSM…" : "API HSM no disponible"}
          </CardTitle>
          <CardDescription className="text-status-danger">
            {result.error}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {isUnconfigured ? (
            <>
              El endpoint{" "}
              <code className="font-mono">/api/external/metrics</code> aún no
              está expuesto en HSM. Cuando se publique y se configuren las env
              vars{" "}
              <code className="font-mono">HSM_BASE_URL</code> +{" "}
              <code className="font-mono">HSM_API_KEY</code> en Vercel del
              portal, los datos aparecerán automáticamente. Spec en{" "}
              <code className="font-mono">docs/connectors/hsm-endpoint-spec.md</code>.
            </>
          ) : (
            <>
              Reintenta más tarde o pulsa &quot;Actualizar&quot; en la barra
              superior. Si persiste, comprueba el deploy de HSM y las env vars
              en Vercel del portal.
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const m = result.data;
  const c = m.current;
  const p = m.previous;

  // % Vencidas / Abiertas — proporción de incidencias en pain entre las
  // actualmente abiertas. Más informativo que el conteo absoluto:
  // 4 vencidas de 50 abiertas (8%) es muy distinto a 4 de 5 (80%).
  const overduePct =
    c.openIncidents > 0 ? (c.overdueCount / c.openIncidents) * 100 : 0;
  const overduePctStatus =
    c.openIncidents === 0
      ? "neutral"
      : overduePct === 0
        ? "ok"
        : overduePct <= 20
          ? "warn"
          : "danger";

  const overdueStatus =
    c.overdueCount === 0 ? "ok" : c.overdueCount <= 5 ? "warn" : "danger";

  const throughputStatus =
    c.throughputRatio >= 1 ? "ok" : c.throughputRatio >= 0.7 ? "warn" : "danger";

  const reopenStatus =
    c.reopenRatePct < 3 ? "ok" : c.reopenRatePct < 7 ? "warn" : "danger";

  const criticalStatus =
    c.criticalInSlaPct === null
      ? "neutral"
      : c.criticalInSlaPct >= 85
        ? "ok"
        : c.criticalInSlaPct >= 70
          ? "warn"
          : "danger";

  const prioritySlices: PieChartSlice[] = c.incidentsByPriority.map((b) => ({
    key: b.priority,
    label: labelForPriority(b.priority),
    value: b.count,
    color: colorForPriority(b.priority),
  }));

  const agingData = c.agingDistribution.map((a) => ({
    bucket: labelForAging(a.bucket),
    Incidencias: a.count,
  }));
  const agingSeries: BarChartSeries[] = [
    {
      dataKey: "Incidencias",
      label: "Abiertas",
      color: "hsl(var(--status-warn))",
    },
  ];

  const periodLabel = `${m.range.from.toISOString().slice(0, 10)} → ${m.range.to.toISOString().slice(0, 10)}`;
  const prevLabel = `${m.range.prevFrom.toISOString().slice(0, 10)} → ${m.range.prevTo.toISOString().slice(0, 10)}`;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Periodo: <span className="font-mono">{periodLabel}</span> · Comparado
        con <span className="font-mono">{prevLabel}</span> · Generado{" "}
        <time dateTime={m.generatedAt.toISOString()}>
          {m.generatedAt.toLocaleString("es-ES")}
        </time>
      </p>

      <section aria-label="Salud del SLA" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Salud del SLA</h2>
          <p className="text-xs text-muted-foreground">
            Cumplimiento, proporción de pain entre las abiertas y respuesta a
            lo crítico.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="Cumplimiento SLA"
            value={`${c.slaCompliancePct.toFixed(1)}%`}
            description={`Periodo anterior: ${p.slaCompliancePct.toFixed(1)}%`}
          />
          <StatCard
            title="% Vencidas"
            value={
              c.openIncidents > 0 ? `${overduePct.toFixed(1)}%` : "—"
            }
            description={
              c.openIncidents > 0
                ? `${c.overdueCount} de ${c.openIncidents} abiertas`
                : "Sin incidencias abiertas"
            }
            status={overduePctStatus}
          />
          <StatCard
            title="Críticas en plazo"
            value={
              c.criticalInSlaPct !== null
                ? `${c.criticalInSlaPct.toFixed(1)}%`
                : "—"
            }
            description="Resueltas en ≤8h"
            status={criticalStatus}
          />
          <StatCard
            title="Vencidas ahora"
            value={c.overdueCount.toLocaleString("es-ES")}
            description="Abiertas con elapsed > umbral"
            status={overdueStatus}
          />
        </div>
      </section>

      <section aria-label="Volumen" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Volumen</h2>
          <p className="text-xs text-muted-foreground">
            Incidencias en curso y capacidad de cierre del periodo.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="Incidencias abiertas"
            value={c.openIncidents.toLocaleString("es-ES")}
            description={`Anterior: ${p.openIncidentsAtClose} al cierre`}
          />
          <StatCard
            title="RMAs activas"
            value={c.activeRmas.toLocaleString("es-ES")}
            description="No recibidas/cerradas/canceladas"
          />
          <StatCard
            title="Throughput"
            value={c.throughputRatio.toFixed(2)}
            description="Cerradas / creadas en el periodo"
            status={throughputStatus}
          />
          <StatCard
            title="Reapertura"
            value={`${c.reopenRatePct.toFixed(1)}%`}
            description={`Anterior: ${p.reopenRatePct.toFixed(1)}%`}
            status={reopenStatus}
          />
        </div>
      </section>

      <section aria-label="Tiempos" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tiempos</h2>
          <p className="text-xs text-muted-foreground">
            Cuánto tarda el equipo en resolver y cuánto los proveedores en
            devolver RMAs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Resolución media"
            value={
              c.avgResolutionHours !== null
                ? `${c.avgResolutionHours.toFixed(1)}h`
                : "—"
            }
            description={
              p.avgResolutionHours !== null
                ? `Anterior: ${p.avgResolutionHours.toFixed(1)}h`
                : "Sin datos del periodo anterior"
            }
          />
          <StatCard
            title="Turnaround RMA"
            value={
              c.avgRmaTurnaroundDays !== null
                ? `${c.avgRmaTurnaroundDays.toFixed(1)}d`
                : "—"
            }
            description="created → final del proveedor"
          />
        </div>
      </section>

      {/* "Carga oculta" — consultas rápidas in-situ. Solo se renderiza si HSM
          devuelve el bloque (v1.1.0+). En HSM v1.0.0 sin el bloque, no aparece. */}
      {c.quickConsultations !== null && (
        <section aria-label="Carga oculta" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Carga oculta · Consultas rápidas
            </h2>
            <p className="text-xs text-muted-foreground">
              Tiempo invertido en consultas atendidas in-situ. NO entra en el
              cálculo SLA — son resoluciones momentáneas que justifican la
              capacidad real del equipo.
            </p>
          </div>
          {(() => {
            const qc = c.quickConsultations;
            if (!qc) return null;
            const prevQc = p.quickConsultations;
            const totalHours = qc.totalMinutes / 60;
            const prevHours =
              prevQc !== null ? prevQc.totalMinutes / 60 : null;
            const countDelta =
              prevQc !== null ? qc.count - prevQc.count : null;
            const deltaSign = countDelta !== null && countDelta > 0 ? "+" : "";

            return (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <StatCard
                    title="Consultas atendidas"
                    value={qc.count.toLocaleString("es-ES")}
                    description={
                      prevQc !== null
                        ? `Anterior: ${prevQc.count} (${deltaSign}${countDelta})`
                        : "Sin datos del periodo anterior"
                    }
                  />
                  <StatCard
                    title="Horas dedicadas"
                    value={`${totalHours.toFixed(1)}h`}
                    description={
                      prevHours !== null
                        ? `Anterior: ${prevHours.toFixed(1)}h`
                        : "Sin datos del periodo anterior"
                    }
                  />
                  <StatCard
                    title="Tiempo medio"
                    value={
                      qc.avgMinutes !== null
                        ? `${qc.avgMinutes.toFixed(1)} min`
                        : "—"
                    }
                    description="Por consulta"
                  />
                  <StatCard
                    title="Conversión a formal"
                    value={`${qc.conversionRatePct.toFixed(1)}%`}
                    description="Consultas escaladas a incidencia"
                  />
                </div>

                {qc.byTechnician.length > 0 && (
                  <div className="rounded-md border border-border bg-card p-4">
                    <h3 className="mb-2 text-sm font-semibold">
                      Reparto por técnico
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {qc.byTechnician.map((t) => {
                        const tHours = (t.totalMinutes / 60).toFixed(1);
                        return (
                          <li
                            key={t.name}
                            className="flex items-center justify-between"
                          >
                            <span className="font-medium">{t.name}</span>
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">
                              {t.count} consultas · {tHours}h
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </section>
      )}

      <section
        aria-label="Distribuciones"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <PieChartCard
          title="Incidencias por prioridad"
          description="Reparto del estado actual (snapshot — abiertas ahora)"
          data={prioritySlices}
          showCenterTotal
          centerLabel="abiertas"
        />
        <BarChartCard
          title="Aging — incidencias abiertas"
          description="Tiempo en estado actual (snapshot, no del periodo)"
          data={agingData}
          xKey="bucket"
          series={agingSeries}
          valueSuffix=" abiertas"
          height={260}
        />
      </section>

      <section aria-label="Top proveedores">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top proveedores</CardTitle>
            <CardDescription>
              {c.topProviders.length} proveedores con más volumen RMA del
              periodo
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-2 text-right font-medium">RMAs</th>
                  <th className="px-4 py-2 text-right font-medium">% éxito</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Turnaround
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.topProviders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Sin RMAs en el periodo seleccionado
                    </td>
                  </tr>
                ) : (
                  c.topProviders.map((prov) => {
                    const successColor =
                      prov.successRatePct >= 80
                        ? "text-status-ok"
                        : prov.successRatePct >= 60
                          ? "text-status-warn"
                          : "text-status-danger";
                    return (
                      <tr
                        key={prov.providerId}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-4 py-2 font-medium">
                          {prov.providerName}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">
                          {prov.rmaCount}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono tabular-nums ${successColor}`}
                        >
                          {prov.successRatePct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">
                          {prov.avgTurnaroundDays !== null
                            ? `${prov.avgTurnaroundDays.toFixed(1)}d`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function HsmDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-80" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
