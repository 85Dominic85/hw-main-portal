"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { previewReportRefresh, saveSection } from "@/server/actions/reports";
import type { ExecutiveSummary } from "@/lib/reports/schema";
import type { ExecRowDiff, RefreshPreview } from "@/lib/reports/refresh-preview";

interface Props {
  reportId: string;
  /** Se llama tras aplicar, con la sección ejecutiva ya persistida. */
  onApplied: (execSummary: ExecutiveSummary) => void;
}

function statusDot(status: string): string {
  if (status === "verde") return "bg-status-ok";
  if (status === "amarillo") return "bg-status-warn";
  if (status === "rojo") return "bg-status-danger";
  return "bg-muted-foreground/40";
}

/** Celda con actual + semana anterior + semáforo de un lado del diff. */
function ValueCell({ actual, prev, status }: { actual: string; prev: string; status: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDot(status))} />
        <span className="text-sm">{actual || <span className="text-muted-foreground">—</span>}</span>
      </div>
      {prev && <span className="pl-3.5 text-[11px] text-muted-foreground">ant.: {prev}</span>}
    </div>
  );
}

export function RefreshSourcesDialog({ reportId, onApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<RefreshPreview | null>(null);
  const [loading, startLoading] = useTransition();
  const [applying, startApplying] = useTransition();

  function handleOpen() {
    setPreview(null);
    setOpen(true);
    startLoading(async () => {
      const res = await previewReportRefresh({ reportId });
      if (!res.ok) {
        toast.error(res.error);
        setOpen(false);
        return;
      }
      setPreview(res.data);
    });
  }

  function handleApply() {
    if (!preview) return;
    startApplying(async () => {
      const res = await saveSection({
        reportId,
        sectionKey: "executiveSummary",
        payload: preview.proposed,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onApplied(preview.proposed);
      toast.success("KPIs actualizados desde los conectores.");
      setOpen(false);
    });
  }

  // Cierra con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !applying) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, applying]);

  const changed = preview?.diff.filter((d) => d.changed) ?? [];
  const unchanged = preview?.diff.filter((d) => !d.changed) ?? [];

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={handleOpen} disabled={loading || open}>
        <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
        {loading ? "Comprobando…" : "Rellenar desde fuentes"}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Rellenar desde fuentes"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !applying && setOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Rellenar desde fuentes</h2>
                <p className="text-xs text-muted-foreground">
                  Revisa qué traerá de MainOps · HW Tool · HSM antes de aplicar. Solo cambia los
                  KPIs automáticos; los manuales y tus comentarios se conservan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !applying && setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading || !preview ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Consultando los conectores…
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm">
                    {preview.changedCount === 0 ? (
                      <span className="text-muted-foreground">
                        No hay cambios: las fuentes coinciden con lo que ya tiene el borrador.
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{preview.changedCount}</span>{" "}
                        {preview.changedCount === 1 ? "KPI cambiará" : "KPIs cambiarán"} si aplicas.
                      </>
                    )}
                  </p>

                  {changed.length > 0 && (
                    <DiffTable title="Cambios" rows={changed} highlight />
                  )}
                  {unchanged.length > 0 && (
                    <DiffTable
                      title={`Sin cambios (${unchanged.length})`}
                      rows={unchanged}
                      highlight={false}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Pie */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={applying}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={applying || loading || !preview || preview.changedCount === 0}
              >
                {applying ? "Aplicando…" : "Aplicar cambios"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DiffTable({
  title,
  rows,
  highlight,
}: {
  title: string;
  rows: ExecRowDiff[];
  highlight: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">KPI</th>
              <th className="px-3 py-2 font-medium">En el borrador</th>
              <th className="px-3 py-2 font-medium">Traerá</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr
                key={d.kpiKey}
                className={cn(
                  "border-b border-border/50 last:border-0",
                  highlight && "bg-status-warn/5",
                )}
              >
                <td className="px-3 py-2 align-top">
                  <div className="font-medium">{d.label || d.kpiKey}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.source === "auto" ? "auto" : "manual"}
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <ValueCell actual={d.before.actual} prev={d.before.prev} status={d.before.status} />
                </td>
                <td
                  className={cn(
                    "px-3 py-2 align-top",
                    highlight && "font-medium",
                  )}
                >
                  <ValueCell actual={d.after.actual} prev={d.after.prev} status={d.after.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
