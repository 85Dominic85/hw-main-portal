import { Suspense } from "react";

import { requireAdminPage } from "@/lib/auth/session";
import { getMainOpsSummary } from "@/server/queries/mainops";
import { getHwToolSummary } from "@/server/queries/hwtool";
import { getHsmSummary } from "@/server/queries/hsm";
import { getConnectorFetchLog } from "@/server/queries/connector-log";
import { homePeriodToRange, isValidHomePeriod, rangeKey } from "@/lib/home/period";
import { mainopsRows, hwtoolRows, hsmRows } from "@/lib/fuentes/fields";
import { SourceCard } from "@/components/fuentes/source-card";
import { FuentesPeriodSelector } from "@/components/shared/fuentes-period-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function FuentesPage({ searchParams }: PageProps) {
  await requireAdminPage("/fuentes");
  const params = await searchParams;
  const period = isValidHomePeriod(params.period) ? params.period : undefined;
  const range = homePeriodToRange(period, params.from, params.to);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fuentes de datos</h1>
          <p className="text-sm text-muted-foreground">
            Qué trae el portal de cada herramienta, de dónde y a qué KPI alimenta · {range.label}
          </p>
        </div>
        <FuentesPeriodSelector />
      </div>

      <Suspense key={rangeKey(range)} fallback={<PanelSkeleton />}>
        <SourcesPanel from={range.from} to={range.to} periodLabel={range.label} />
      </Suspense>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Historial de llamadas a conectores</h2>
        <p className="text-xs text-muted-foreground">
          Se registra cada llamada real (cache-miss). Las recargas dentro de 60s reutilizan caché y no generan entradas.
        </p>
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
          <HistoryPanel />
        </Suspense>
      </section>
    </div>
  );
}

async function SourcesPanel({
  from,
  to,
  periodLabel,
}: {
  from: Date;
  to: Date;
  periodLabel: string;
}) {
  const [mainops, hwtool, hsm] = await Promise.all([
    getMainOpsSummary({ from, to }),
    getHwToolSummary({ from, to }),
    getHsmSummary({ from, to }),
  ]);

  const timeFmt = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    }).format(d);

  const mainopsUrl = process.env.MAINOPS_BASE_URL
    ? `${process.env.MAINOPS_BASE_URL}/api/external/metrics`
    : "MAINOPS_BASE_URL no configurada";
  const hwtoolUrl =
    process.env.HWTOOL_ANALYTICS_API_URL ?? "HWTOOL_ANALYTICS_API_URL no configurada";
  const hsmUrl = process.env.HSM_BASE_URL
    ? `${process.env.HSM_BASE_URL}/api/external/metrics`
    : "HSM: endpoint pendiente (HSM_BASE_URL/API_KEY no configuradas)";

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <SourceCard
        name="MainOps · Logística"
        endpoint={mainopsUrl}
        configured={Boolean(process.env.MAINOPS_BASE_URL && process.env.MAINOPS_API_KEY)}
        ok={mainops.ok}
        error={mainops.ok ? undefined : mainops.error}
        periodLabel={periodLabel}
        meta={mainops.ok ? `generado ${timeFmt(mainops.data.generatedAt)}` : undefined}
        rows={mainops.ok ? mainopsRows(mainops.data) : []}
        raw={mainops.ok ? mainops.data : { error: mainops.error }}
      />
      <SourceCard
        name="HW Tool · Configuraciones"
        endpoint={hwtoolUrl}
        configured={Boolean(
          process.env.HWTOOL_ANALYTICS_API_URL && process.env.HWTOOL_ANALYTICS_API_KEY,
        )}
        ok={hwtool.ok}
        error={hwtool.ok ? undefined : hwtool.error}
        periodLabel={periodLabel}
        meta={hwtool.ok ? `schema ${hwtool.data.schemaVersion}` : undefined}
        rows={hwtool.ok ? hwtoolRows(hwtool.data) : []}
        raw={hwtool.ok ? hwtool.data : { error: hwtool.error }}
      />
      <SourceCard
        name="HSM · Soporte"
        endpoint={hsmUrl}
        configured={Boolean(process.env.HSM_BASE_URL && process.env.HSM_API_KEY)}
        ok={hsm.ok}
        error={hsm.ok ? undefined : hsm.error}
        periodLabel={periodLabel}
        meta={hsm.ok ? `generado ${timeFmt(hsm.data.generatedAt)}` : undefined}
        rows={hsm.ok ? hsmRows(hsm.data) : []}
        raw={hsm.ok ? hsm.data : { error: hsm.error }}
      />
    </div>
  );
}

const CONNECTOR_LABEL: Record<string, string> = {
  mainops: "MainOps",
  hwtool: "HW Tool",
  hsm: "HSM",
};

async function HistoryPanel() {
  const log = await getConnectorFetchLog(50);

  if (log.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Aún no hay llamadas registradas.
        </CardContent>
      </Card>
    );
  }

  const dt = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Madrid",
    }).format(d);

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Hora</th>
              <th className="px-3 py-2 font-medium">Conector</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Latencia</th>
              <th className="px-3 py-2 font-medium">Periodo</th>
              <th className="px-3 py-2 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {log.map((e, i) => {
              const p = (e.params ?? {}) as { from?: string; to?: string };
              const rango = p.from || p.to ? `${p.from ?? "—"} → ${p.to ?? "—"}` : "—";
              return (
                <tr
                  key={e.id}
                  className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/20")}
                >
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {dt(e.createdAt)}
                  </td>
                  <td className="px-3 py-1.5">{CONNECTOR_LABEL[e.connector] ?? e.connector}</td>
                  <td className="px-3 py-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs",
                        e.ok ? "text-status-ok" : "text-status-danger",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          e.ok ? "bg-status-ok" : "bg-status-danger",
                        )}
                      />
                      {e.ok ? "OK" : `Error${e.statusCode ? ` ${e.statusCode}` : ""}`}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{e.latencyMs} ms</td>
                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {rango}
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-1.5 text-xs text-muted-foreground" title={e.error ?? ""}>
                    {e.error ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function PanelSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-72 w-full rounded-lg" />
      ))}
    </div>
  );
}
