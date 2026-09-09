"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/reports/tiptap-editor";
import { emptyTiptapDoc, type TiptapDoc } from "@/lib/reports/schema/tiptap";
import { LOG_ENTRY_STATUSES, type LogEntryStatus } from "@/lib/db/schema/log-entries";
import { createLogEntry, updateLogEntry } from "@/server/actions/bitacora";
import { cn } from "@/lib/utils/cn";
import { TagInput } from "./tag-input";

const STATUS_LABEL: Record<LogEntryStatus, string> = {
  abierta: "Abierta",
  resuelta: "Resuelta",
  seguimiento: "Seguimiento",
};

export interface EntryDraft {
  id?: string;
  entryDate: string;
  title: string;
  body: TiptapDoc;
  tags: string[];
  client: string;
  status: LogEntryStatus | null;
  highlight: boolean;
}

interface EntryComposerProps {
  /** Fecha por defecto (`YYYY-MM-DD`), normalmente hoy. */
  defaultDate: string;
  /** Clientes ya usados, para el autocompletado del campo. */
  knownClients: string[];
  /** Si viene, el composer edita esa entrada en lugar de crear una nueva. */
  initial?: EntryDraft;
  onCancel?: () => void;
  onSaved?: () => void;
}

function blankDraft(date: string): EntryDraft {
  return {
    entryDate: date,
    title: "",
    body: emptyTiptapDoc(),
    tags: [],
    client: "",
    status: null,
    highlight: false,
  };
}

/**
 * Formulario de entrada de bitácora.
 *
 * El cuerpo es texto libre (TipTap, el mismo editor de los informes) y las
 * etiquetas son opcionales. `status` y `highlight` son las dos únicas marcas
 * estructuradas, también opcionales: existen porque el scorecard semanal no
 * puede deducir del texto si una incidencia quedó abierta ni qué fue lo
 * importante de la semana.
 */
export function EntryComposer({
  defaultDate,
  knownClients,
  initial,
  onCancel,
  onSaved,
}: EntryComposerProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [draft, setDraft] = React.useState<EntryDraft>(
    initial ?? blankDraft(defaultDate),
  );
  const [pending, setPending] = React.useState(false);
  // Fuerza el remount del editor TipTap al limpiar: su contenido es interno,
  // cambiar la prop `value` no lo vacía.
  const [editorKey, setEditorKey] = React.useState(0);

  const patch = (p: Partial<EntryDraft>) => setDraft((d) => ({ ...d, ...p }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);

    const payload = {
      ...(isEdit ? { id: initial?.id } : {}),
      entryDate: draft.entryDate,
      title: draft.title.trim() || undefined,
      body: draft.body,
      tags: draft.tags,
      client: draft.client.trim() || undefined,
      status: draft.status,
      highlight: draft.highlight,
    };

    const result = isEdit
      ? await updateLogEntry(payload)
      : await createLogEntry(payload);

    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Entrada actualizada" : "Entrada guardada");
    if (!isEdit) {
      // Se conserva la fecha: lo normal es escribir varias entradas del mismo día.
      setDraft(blankDraft(draft.entryDate));
      setEditorKey((k) => k + 1);
    }
    router.refresh();
    onSaved?.();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="entry-date">Día</Label>
              <Input
                id="entry-date"
                type="date"
                required
                value={draft.entryDate}
                onChange={(e) => patch({ entryDate: e.target.value })}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entry-title">
                Título <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="entry-title"
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Si lo dejas vacío se usa la primera línea"
                maxLength={140}
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Qué pasó</Label>
            <TiptapEditor
              key={editorKey}
              value={draft.body}
              onChange={(body) => patch({ body })}
              placeholder="Llamada, incidencia, configuración, visita… escribe con tus palabras."
              className="min-h-[140px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="entry-client">
                Cliente o local <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="entry-client"
                list="bitacora-clients"
                value={draft.client}
                onChange={(e) => patch({ client: e.target.value })}
                placeholder="Bar Manolo, Grupo Tapas&Co…"
                maxLength={120}
                disabled={pending}
              />
              <datalist id="bitacora-clients">
                {knownClients.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label>
                Etiquetas <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <TagInput
                value={draft.tags}
                onChange={(tags) => patch({ tags })}
                disabled={pending}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label>
                Estado <span className="text-muted-foreground">(si se abre y se cierra)</span>
              </Label>
              <div className="flex flex-wrap gap-1">
                {LOG_ENTRY_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    onClick={() => patch({ status: draft.status === s ? null : s })}
                    aria-pressed={draft.status === s}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50",
                      draft.status === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={() => patch({ highlight: !draft.highlight })}
              aria-pressed={draft.highlight}
              title="Lo marcado sube al resumen semanal"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                draft.highlight
                  ? "border-status-warn/40 bg-status-warn/10 text-status-warn"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Star
                className={cn("h-3.5 w-3.5", draft.highlight && "fill-current")}
                aria-hidden="true"
              />
              Destacar en el resumen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {isEdit ? "Guardar cambios" : "Añadir entrada"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={pending}
                className="gap-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
