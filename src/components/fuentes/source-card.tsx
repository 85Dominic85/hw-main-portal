import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { DataRow } from "@/lib/fuentes/fields";
import { RawJsonDialog } from "./raw-json-dialog";

export interface SourceCardProps {
  name: string;
  /** URL del endpoint (o mensaje si no está configurado). */
  endpoint: string;
  /** ¿La llamada fue bien? */
  ok: boolean;
  /** ¿Está configurado el conector (env vars)? */
  configured: boolean;
  error?: string;
  periodLabel: string;
  /** Metadato extra: schema version / hora de generación. */
  meta?: string;
  rows: DataRow[];
  /** Objeto crudo para el modal "Ver JSON". */
  raw: unknown;
}

export function SourceCard({
  name,
  endpoint,
  ok,
  configured,
  error,
  periodLabel,
  meta,
  rows,
  raw,
}: SourceCardProps) {
  const state = !configured ? "pending" : ok ? "ok" : "error";

  return (
    <Card className="flex h-[34rem] flex-col">
      <CardHeader className="shrink-0 gap-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  state === "ok" && "bg-status-ok",
                  state === "error" && "bg-status-danger",
                  state === "pending" && "bg-muted-foreground/40",
                )}
                aria-hidden="true"
              />
              <h3 className="truncate text-base font-semibold">{name}</h3>
            </div>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={endpoint}>
              {endpoint}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0",
              state === "ok" && "border-status-ok/40 text-status-ok",
              state === "error" && "border-status-danger/40 text-status-danger",
              state === "pending" && "text-muted-foreground",
            )}
          >
            {state === "ok" ? "OK" : state === "error" ? "Error" : "No configurado"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Periodo: {periodLabel}</span>
          {meta && <span>· {meta}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-0">
        {state !== "ok" ? (
          <p
            className={cn(
              "shrink-0 rounded-md border px-3 py-2 text-xs",
              state === "error"
                ? "border-status-danger/30 bg-status-danger/5 text-status-danger"
                : "border-border bg-muted/30 text-muted-foreground",
            )}
          >
            {error ?? "Sin datos para este periodo."}
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[46%]" />
                <col className="w-[24%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead>
                <tr className="sticky top-0 z-10 border-b border-border bg-muted text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Dato</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium">Alimenta KPI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.label}-${i}`}
                    className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/20")}
                  >
                    <td className="px-3 py-1.5 align-top break-words">{r.label}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right align-top tabular-nums">
                      {r.value}
                      {r.unit ? <span className="ml-1 text-xs text-muted-foreground">{r.unit}</span> : null}
                    </td>
                    <td className="px-3 py-1.5 align-top break-words">
                      {r.feeds ? (
                        <span className="text-xs text-foreground/80">→ {r.feeds}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-auto flex shrink-0 justify-end pt-1">
          <RawJsonDialog title={name} data={raw} />
        </div>
      </CardContent>
    </Card>
  );
}
