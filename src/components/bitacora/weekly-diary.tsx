import Link from "next/link";

import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import type { TiptapDoc } from "@/lib/reports/schema";
import type { WeeklySummary } from "@/lib/bitacora/weekly-summary";
import { authorDisplayName } from "@/lib/bitacora/weekly-summary";
import { entryHeading } from "@/lib/bitacora/to-markdown";
import { tagLabel } from "@/lib/bitacora/tags";
import { formatDayLabel } from "@/lib/bitacora/work-week";
import { cn } from "@/lib/utils/cn";
import { RichText } from "./rich-text";

/**
 * Diario de la semana — la capa "A" del recopilatorio, debajo del scorecard.
 *
 * Tres formas de leer lo mismo, conmutables por querystring. Las tres se
 * sirven del mismo objeto `WeeklySummary`, así que cambiar de vista es
 * maquetación y no vuelve a consultar nada:
 *
 *   · dias     — cronológico, lunes a viernes (el formato del cuaderno)
 *   · temas    — agrupado por etiqueta, lo sin etiquetar al final
 *   · personas — agrupado por autor
 *
 * Server component puro: se lee, no se opera.
 */

const VIEW_LABEL = {
  dias: "Por días",
  temas: "Por temas",
  personas: "Por personas",
} as const;

type View = keyof typeof VIEW_LABEL;

interface WeeklyDiaryProps {
  summary: WeeklySummary;
  view: View;
  weekKey: string;
}

export function WeeklyDiary({ summary, view, weekKey }: WeeklyDiaryProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Diario de la semana</h2>
        <nav className="flex gap-1" aria-label="Cómo agrupar el diario">
          {(Object.keys(VIEW_LABEL) as View[]).map((v) => (
            <Link
              key={v}
              href={
                v === "dias"
                  ? `/bitacora/semana/${weekKey}`
                  : `/bitacora/semana/${weekKey}?vista=${v}`
              }
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                view === v
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {VIEW_LABEL[v]}
            </Link>
          ))}
        </nav>
      </div>

      {summary.totals.entries === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No se registró ninguna entrada esta semana.
        </p>
      ) : view === "temas" ? (
        <ByTheme summary={summary} />
      ) : view === "personas" ? (
        <ByPerson summary={summary} />
      ) : (
        <ByDay summary={summary} />
      )}
    </section>
  );
}

/* ── Vistas ──────────────────────────────────────────────────────────────── */

function ByDay({ summary }: { summary: WeeklySummary }) {
  const days = summary.byWorkDay.filter((d) => d.entries.length > 0);

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <GroupBlock
          key={day.dateKey}
          title={capitalize(formatDayLabel(day.dateKey))}
          count={day.entries.length}
        >
          {day.entries.map((entry) => (
            <ReadOnlyEntry key={entry.id} entry={entry} />
          ))}
        </GroupBlock>
      ))}

      {summary.offHours.length > 0 && (
        <GroupBlock title="Fuera de horario" count={summary.offHours.length}>
          {summary.offHours.map((entry) => (
            <ReadOnlyEntry key={entry.id} entry={entry} showDate />
          ))}
        </GroupBlock>
      )}
    </div>
  );
}

function ByTheme({ summary }: { summary: WeeklySummary }) {
  return (
    <div className="space-y-6">
      {summary.byTag.map((group) => (
        <GroupBlock
          key={group.key}
          title={tagLabel(group.key)}
          count={group.entries.length}
          mono
        >
          {group.entries.map((entry) => (
            <ReadOnlyEntry key={entry.id} entry={entry} showDate />
          ))}
        </GroupBlock>
      ))}

      {summary.untagged.length > 0 && (
        <GroupBlock title="Sin etiquetar" count={summary.untagged.length}>
          {summary.untagged.map((entry) => (
            <ReadOnlyEntry key={entry.id} entry={entry} showDate />
          ))}
        </GroupBlock>
      )}
    </div>
  );
}

function ByPerson({ summary }: { summary: WeeklySummary }) {
  return (
    <div className="space-y-6">
      {summary.byAuthor.map((group) => {
        const first = group.entries[0];
        return (
          <GroupBlock
            key={group.key}
            title={first ? authorDisplayName(first) : group.key}
            count={group.entries.length}
          >
            {group.entries.map((entry) => (
              <ReadOnlyEntry key={entry.id} entry={entry} showDate hideAuthor />
            ))}
          </GroupBlock>
        );
      })}
    </div>
  );
}

/* ── Piezas ──────────────────────────────────────────────────────────────── */

function GroupBlock({
  title,
  count,
  mono,
  children,
}: {
  title: string;
  count: number;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2.5">
        <h3
          className={cn(
            "text-xs font-semibold uppercase tracking-wide text-foreground",
            mono && "font-mono normal-case tracking-normal",
          )}
        >
          {title}
        </h3>
        <span className="rounded-full border border-border bg-secondary/50 px-1.5 font-mono text-[10px] text-muted-foreground">
          {count}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  abierta: "Abierta",
  resuelta: "Resuelta",
  seguimiento: "Seguimiento",
};

const STATUS_STYLE: Record<string, string> = {
  abierta: "border-status-warn/40 bg-status-warn/10 text-status-warn",
  resuelta: "border-status-ok/40 bg-status-ok/10 text-status-ok",
  seguimiento: "border-border bg-secondary/60 text-muted-foreground",
};

/**
 * Entrada en modo lectura. No monta TipTap: el recopilatorio puede tener 20
 * entradas y cargar 20 editores sería absurdo. Muestra el texto plano ya
 * derivado en `body_text`, que es exactamente lo que se escribió.
 */
function ReadOnlyEntry({
  entry,
  showDate,
  hideAuthor,
}: {
  entry: LogEntryRow;
  showDate?: boolean;
  hideAuthor?: boolean;
}) {
  const meta = [
    hideAuthor ? null : authorDisplayName(entry),
    showDate ? formatDayLabel(String(entry.entryDate).slice(0, 10)) : null,
    entry.client?.trim() || null,
  ].filter(Boolean);

  const hasTitle = Boolean(entry.title?.trim());

  return (
    <article
      className={cn(
        "border-l-2 pl-3.5",
        entry.highlight ? "border-status-warn/50" : "border-border",
      )}
    >
      {/* Solo se pone encabezado si la entrada tiene título propio. Sin título,
          el cuerpo hace de encabezado y se muestra ENTERO — poner aquí su
          primera línea y omitir el resto perdería contenido. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {hasTitle && (
          <h4 className="text-sm font-semibold leading-snug text-foreground">
            {entry.title!.trim()}
          </h4>
        )}
        {entry.status && (
          <span
            className={cn(
              "rounded-full border px-2 text-[11px] font-medium",
              STATUS_STYLE[entry.status],
            )}
          >
            {STATUS_LABEL[entry.status] ?? entry.status}
          </span>
        )}
      </div>

      {meta.length > 0 && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.join(" · ")}</p>
      )}

      {entry.bodyText ? (
        <RichText
          doc={entry.body as TiptapDoc}
          className={cn(
            // Sin título el cuerpo es el contenido principal: tinta normal.
            hasTitle ? "mt-1 text-muted-foreground" : "mt-1 text-foreground",
          )}
        />
      ) : (
        !hasTitle && (
          <p className="mt-1 text-sm text-muted-foreground">{entryHeading(entry)}</p>
        )
      )}

      {(entry.tags ?? []).length > 0 && (
        <p className="mt-1 flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-1.5 font-mono text-[10px] text-muted-foreground"
            >
              {tagLabel(tag)}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
