"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { TiptapDoc } from "@/lib/reports/schema";
import type { LogEntryRow, LogEntryStatus } from "@/lib/db/schema/log-entries";
import { authorDisplayName } from "@/lib/bitacora/weekly-summary";
import { entryHeading } from "@/lib/bitacora/to-markdown";
import { tagLabel } from "@/lib/bitacora/tags";
import { isEmptyDoc } from "@/lib/bitacora/body-text";
import { deleteLogEntry } from "@/server/actions/bitacora";
import { cn } from "@/lib/utils/cn";
import { EntryComposer, type EntryDraft } from "./entry-composer";
import { RichText } from "./rich-text";

const STATUS_STYLE: Record<LogEntryStatus, string> = {
  abierta: "border-status-warn/40 bg-status-warn/10 text-status-warn",
  resuelta: "border-status-ok/40 bg-status-ok/10 text-status-ok",
  seguimiento: "border-border bg-secondary/60 text-muted-foreground",
};

const STATUS_LABEL: Record<LogEntryStatus, string> = {
  abierta: "Abierta",
  resuelta: "Resuelta",
  seguimiento: "Seguimiento",
};

interface EntryCardProps {
  entry: LogEntryRow;
  /** Email de la sesión — solo el autor ve editar/borrar. */
  currentEmail: string;
  knownClients: string[];
  /** Oculta el nombre del autor (redundante en la vista agrupada por persona). */
  hideAuthor?: boolean;
}

export function EntryCard({
  entry,
  currentEmail,
  knownClients,
  hideAuthor,
}: EntryCardProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const isOwn = entry.authorEmail === currentEmail;

  if (editing) {
    const draft: EntryDraft = {
      id: entry.id,
      entryDate: String(entry.entryDate).slice(0, 10),
      title: entry.title ?? "",
      body: entry.body as TiptapDoc,
      tags: [...(entry.tags ?? [])],
      client: entry.client ?? "",
      status: entry.status as LogEntryStatus | null,
      highlight: entry.highlight,
    };
    return (
      <EntryComposer
        defaultDate={draft.entryDate}
        knownClients={knownClients}
        initial={draft}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  async function onDelete() {
    if (deleting) return;
    if (!window.confirm("¿Borrar esta entrada de la bitácora? No se puede recuperar.")) {
      return;
    }
    setDeleting(true);
    const result = await deleteLogEntry({ id: entry.id });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Entrada borrada");
    router.refresh();
  }

  const body = entry.body as TiptapDoc;
  const hasTitle = Boolean(entry.title?.trim());
  const hasBody = !isEmptyDoc(body);
  // Solo se pone encabezado si hay título propio. Sin título, el cuerpo hace de
  // encabezado — así no se repite la primera línea dos veces.
  const heading = hasTitle ? entry.title!.trim() : hasBody ? null : entryHeading(entry);

  return (
    <article
      className={cn(
        "group border-l-2 pl-4 transition-colors",
        entry.highlight ? "border-status-warn/50" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {entry.highlight && (
          <Star
            className="h-3.5 w-3.5 shrink-0 fill-current text-status-warn"
            aria-label="Destacada en el resumen"
          />
        )}
        {heading && (
          <h3 className="text-sm font-semibold leading-snug text-foreground">{heading}</h3>
        )}
        {entry.status && (
          <span
            className={cn(
              "rounded-full border px-2 py-0 text-[11px] font-medium",
              STATUS_STYLE[entry.status as LogEntryStatus],
            )}
          >
            {STATUS_LABEL[entry.status as LogEntryStatus]}
          </span>
        )}

        {isOwn && (
          <span className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Editar entrada"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Borrar entrada"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-status-danger/10 hover:text-status-danger disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        {!hideAuthor && (
          <span className="font-medium text-foreground">{authorDisplayName(entry)}</span>
        )}
        {entry.client?.trim() && (
          <span className="rounded border border-border bg-secondary/50 px-1.5 py-0 text-foreground">
            {entry.client.trim()}
          </span>
        )}
        {(entry.tags ?? []).map((tag) => (
          <span key={tag} className="rounded-full border border-border px-1.5 py-0 font-mono">
            {tagLabel(tag)}
          </span>
        ))}
      </div>

      {hasBody && (
        <RichText
          doc={body}
          className={cn(
            // Sin título el cuerpo es el contenido principal: tinta normal.
            heading ? "mt-1.5 text-muted-foreground" : "mt-1 text-foreground",
          )}
        />
      )}
    </article>
  );
}
