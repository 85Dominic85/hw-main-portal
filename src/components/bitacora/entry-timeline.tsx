"use client";

import * as React from "react";
import { NotebookPen } from "lucide-react";

import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import { formatDayLabel } from "@/lib/bitacora/work-week";
import { EntryCard } from "./entry-card";

interface EntryTimelineProps {
  entries: LogEntryRow[];
  currentEmail: string;
  knownClients: string[];
  /** Texto del estado vacío, según si hay filtros aplicados o no. */
  emptyMessage?: string;
}

/** `entry_date` llega como string (`date` de postgres-js) o Date. */
function dateKey(entry: LogEntryRow): string {
  const raw: unknown = entry.entryDate;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

/**
 * Diario de la bitácora: entradas agrupadas por día, el más reciente arriba.
 * Es la vista de trabajo — el formato en el que se rellena.
 */
export function EntryTimeline({
  entries,
  currentEmail,
  knownClients,
  emptyMessage = "Todavía no hay entradas. Escribe la primera arriba.",
}: EntryTimelineProps) {
  const days = React.useMemo(() => {
    const buckets = new Map<string, LogEntryRow[]>();
    for (const entry of entries) {
      const key = dateKey(entry);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(entry);
      else buckets.set(key, [entry]);
    }
    // `entries` ya viene ordenado descendente desde la query.
    return [...buckets.entries()];
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
        <NotebookPen className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {days.map(([day, dayEntries]) => (
        <section key={day} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
              {formatDayLabel(day)}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {dayEntries.length} {dayEntries.length === 1 ? "entrada" : "entradas"}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-4">
            {dayEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                currentEmail={currentEmail}
                knownClients={knownClients}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
