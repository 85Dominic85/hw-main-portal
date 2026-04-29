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
import { MainOpsPeriodSelector } from "@/components/shared/mainops-period-selector";
import { getMainOpsSummary } from "@/server/queries/mainops";
import {
  colorForPurchaseType,
  colorForOrderStatus,
  labelForPurchaseType,
  labelForOrderStatus,
} from "@/lib/connectors/mainops";
import {
  MAINOPS_DEFAULT_PERIOD,
  isValidPeriod,
  periodToFilter,
  type MainOpsPeriod,
} from "@/lib/mainops/period";
import { formatEur, formatEurCompact } from "@/lib/utils/format-currency";
import { formatRelativeTime } from "@/lib/utils/format";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function MainOpsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period: MainOpsPeriod = isValidPeriod(params.period)
    ? params.period
    : MAINOPS_DEFAULT_PERIOD;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MainOps</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos, ingresos y SLA del periodo seleccionado.
          </p>
        </div>
        <MainOpsPeriodSelector />
      </div>

      <Suspense key={period} fallback={<MainOpsDashboardSkeleton />}>
        <MainOpsDashboard period={period} />
      </Suspense>
    </div>
  );
}

async function MainOpsDashboard({ period }: { period: MainOpsPeriod }) {
  const filter = periodToFilter(period);
  const result = await getMainOpsSummary({ ...filter, recentLimit: 10 });

  if (!result.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API MainOps no disponible</CardTitle>
          <CardDescription className="text-status-danger">
            {result.error}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Reintenta más tarde o pulsa &quot;Actualizar&quot; en la barra superior. Si
          persiste, comprueba que el endpoint{" "}
          <code className="font-mono">/api/external/metrics</code> está
          desplegado en MainOps y que las variables{" "}
          <code className="font-mono">MAINOPS_BASE_URL</code> y{" "}
          <code className="font-mono">MAINOPS_API_KEY</code> están configuradas
          en Vercel.
        </CardContent>
      </Card>
    );
  }

  const m = result.data;
  const onTimePctPct = Math.round(m.sla.onTimePct * 1000) / 10; // 1 decimal
  const completedRatePct = Math.round(m.kpis.completedRate * 1000) / 10;

  const slaStatus =
    onTimePctPct >= 95 ? "ok" : onTimePctPct >= 85 ? "warn" : "danger";
  const completedStatus =
    completedRatePct >= 80 ? "ok" : completedRatePct >= 60 ? "warn" : "danger";

  const purchaseSlices: PieChartSlice[] = m.breakdowns.byPurchaseType.map((b) => ({
    key: b.purchaseType,
    label: labelForPurchaseType(b.purchaseType),
    value: b.count,
    color: colorForPurchaseType(b.purchaseType),
  }));

  const statusSlices: PieChartSlice[] = m.breakdowns.byStatus.map((b) => ({
    key: b.status,
    label: labelForOrderStatus(b.status),
    value: b.count,
    color: colorForOrderStatus(b.status),
  }));

  const periodLabel = `${m.range.from.toISOString().slice(0, 10)} → ${m.range.to.toISOString().slice(0, 10)}`;

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
          title="Pedidos"
          value={m.kpis.totalOrders.toLocaleString("es-ES")}
          description={`${m.sla.totalDelivered} entregados`}
        />
        <StatCard
          title="Ingresos"
          value={formatEurCompact(m.kpis.totalRevenueEur)}
          description={formatEur(m.kpis.totalRevenueEur, { decimals: 2 })}
        />
        <StatCard
          title="Ticket medio"
          value={formatEur(m.kpis.avgOrderValueEur)}
          description={`Promedio del periodo`}
        />
        <StatCard
          title="% SLA on-time"
          value={`${onTimePctPct}%`}
          description={`${m.sla.avgDeliveryDays.toFixed(1)}d promedio · ${m.sla.breachedCount} rotos`}
          status={slaStatus}
        />
        <StatCard
          title="% completados"
          value={`${completedRatePct}%`}
          description={`${m.sla.activeAtRisk} en riesgo`}
          status={completedStatus}
        />
      </section>

      <section
        aria-label="Distribuciones"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <PieChartCard
          title="Tipos de compra"
          description={`Pedidos por tipo (${m.kpis.totalOrders} total)`}
          data={purchaseSlices}
          showCenterTotal
          centerLabel="pedidos"
        />
        <PieChartCard
          title="Estados de los pedidos"
          description="Reparto actual por estado"
          data={statusSlices}
          showCenterTotal
          centerLabel="pedidos"
        />
      </section>

      <section aria-label="Pedidos recientes">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos recientes</CardTitle>
            <CardDescription>
              Últimos {m.recentOrders.length} pedidos del periodo
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Operación</th>
                  <th className="px-4 py-2 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Importe</th>
                  <th className="px-4 py-2 text-left font-medium">Estado</th>
                  <th className="px-4 py-2 text-right font-medium">Hace</th>
                </tr>
              </thead>
              <tbody>
                {m.recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Sin pedidos en el periodo seleccionado
                    </td>
                  </tr>
                ) : (
                  m.recentOrders.map((o) => (
                    <tr key={o.operationId} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">
                        {o.operationId}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{o.customerName}</div>
                        {o.venueName && (
                          <div className="text-xs text-muted-foreground">
                            {o.venueName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {o.purchaseType
                          ? labelForPurchaseType(o.purchaseType)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">
                        {o.amountEur !== null ? formatEur(o.amountEur) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs"
                          style={{
                            backgroundColor: `${colorForOrderStatus(o.status)}20`,
                            color: colorForOrderStatus(o.status),
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: colorForOrderStatus(o.status) }}
                          />
                          {labelForOrderStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground tabular-nums">
                        {formatRelativeTime(o.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MainOpsDashboardSkeleton() {
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
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
