import { Star } from "lucide-react";

import type { WeeklySummary } from "@/lib/bitacora/weekly-summary";
import { tagLabel } from "@/lib/bitacora/tags";
import { cn } from "@/lib/utils/cn";

/**
 * Scorecard de la semana — la capa "C" del recopilatorio.
 *
 * Todo lo que hay aquí está CALCULADO desde las entradas: nadie escribe este
 * bloque. Las dos únicas piezas que no son cuentas puras ("sigue abierto" y
 * "lo que hay que mirar") vienen de las marcas opcionales `status` y
 * `highlight` que se ponen al escribir la entrada.
 *
 * Server component: solo pinta, no necesita interactividad.
 */
export function WeeklyScorecard({ summary }: { summary: WeeklySummary }) {
  const { totals } = summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Entradas registradas"
          value={totals.entries}
          foot={`${totals.perWorkDay.toLocaleString("es-ES")} al día laborable`}
        />
        <Tile
          label="Con estado"
          value={totals.incidents.total}
          tone={totals.incidents.abiertas > 0 ? "warn" : totals.incidents.total > 0 ? "ok" : "neutral"}
          foot={
            totals.incidents.total === 0
              ? "Nadie marcó estado"
              : [
                  totals.incidents.resueltas
                    ? `${totals.incidents.resueltas} resueltas`
                    : null,
                  totals.incidents.abiertas ? `${totals.incidents.abiertas} abiertas` : null,
                  totals.incidents.seguimiento
                    ? `${totals.incidents.seguimiento} en seguimiento`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
          }
        />
        <Tile
          label="Clientes tocados"
          value={totals.clients}
          foot={
            summary.clients.length
              ? truncateList(summary.clients, 2)
              : "Ninguno anotado"
          }
        />
        <Tile
          label="Quién escribió"
          value={totals.authors.length}
          foot={
            totals.authors.length
              ? totals.authors.map((a) => `${a.name} ${a.entries}`).join(" · ")
              : "Semana sin registro"
          }
        />
      </div>

      <ActivityChart summary={summary} />

      {summary.tagRanking.length > 0 && <TagRanking summary={summary} />}

      {summary.highlights.length > 0 && (
        <section className="space-y-2">
          <SectionTitle>
            <Star className="h-3.5 w-3.5 fill-current text-status-warn" aria-hidden="true" />
            Lo que hay que mirar
          </SectionTitle>
          <ul className="space-y-2">
            {summary.highlights.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-status-warn/30 bg-status-warn/5 px-3 py-2"
              >
                <p className="text-sm font-semibold text-foreground">
                  {entry.title?.trim() || "(sin título)"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    entry.authorName?.trim() || entry.authorEmail.split("@")[0],
                    entry.client?.trim(),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.openItems.length > 0 && (
        <section className="space-y-2">
          <SectionTitle>Sigue abierto al cerrar la semana</SectionTitle>
          <ul className="space-y-1.5">
            {summary.openItems.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-warn" aria-hidden="true" />
                <span className="font-medium text-foreground">
                  {entry.title?.trim() || "(sin título)"}
                </span>
                {entry.client?.trim() && (
                  <span className="text-xs text-muted-foreground">{entry.client.trim()}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ── Piezas ──────────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function Tile({
  label,
  value,
  foot,
  tone = "neutral",
}: {
  label: string;
  value: number;
  foot: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3.5 py-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold leading-none tabular-nums tracking-tight",
          tone === "ok" && "text-status-ok",
          tone === "warn" && "text-status-warn",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{foot}</p>
    </div>
  );
}

/**
 * Actividad por día laborable — 5 barras, lunes a viernes.
 *
 * Una sola serie (número de entradas), así que no necesita leyenda: el título
 * la nombra. Cada barra lleva su valor encima, que con 5 marcas es legible sin
 * saturar. La escala se fija con el día de mayor actividad, y el eje inferior
 * hace de línea base.
 */
function ActivityChart({ summary }: { summary: WeeklySummary }) {
  // Con pico 0 (semana vacía) todas las barras quedan al mínimo visible.
  const max = Math.max(summary.peakDayEntries, 1);

  return (
    <section className="space-y-2">
      <SectionTitle>Actividad por día</SectionTitle>
      <div>
        <div
          className="flex h-[104px] items-end gap-2.5 border-b border-border pt-5"
          role="img"
          aria-label={`Entradas por día: ${summary.byWorkDay
            .map((d) => `${d.label} ${d.entries.length}`)
            .join(", ")}`}
        >
          {summary.byWorkDay.map((day) => {
            const n = day.entries.length;
            const pct = (n / max) * 100;
            return (
              <div
                key={day.dateKey}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                  {n}
                </span>
                <span
                  className={cn(
                    "w-full max-w-[28px] rounded-t",
                    n === 0 ? "bg-border" : "bg-primary/70",
                  )}
                  style={{ height: n === 0 ? "2px" : `${Math.max(pct, 4)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2.5 pt-1.5">
          {summary.byWorkDay.map((day) => (
            <span
              key={day.dateKey}
              className="flex-1 text-center font-mono text-[10px] tracking-wide text-muted-foreground"
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>
      {summary.offHours.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Además, {summary.offHours.length}{" "}
          {summary.offHours.length === 1 ? "entrada" : "entradas"} registradas en fin
          de semana — fuera de la gráfica, en el diario de abajo.
        </p>
      )}
    </section>
  );
}

function TagRanking({ summary }: { summary: WeeklySummary }) {
  const max = summary.tagRanking[0]?.count ?? 1;
  const multiTagged = summary.tagRanking.reduce((n, t) => n + t.count, 0);
  const tagged = summary.totals.entries - summary.untagged.length;

  return (
    <section className="space-y-2">
      <SectionTitle>Dónde se fue la semana</SectionTitle>
      <ul className="space-y-1.5">
        {summary.tagRanking.slice(0, 10).map((t) => (
          <li key={t.tag} className="grid grid-cols-[110px_1fr_28px] items-center gap-2.5">
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {tagLabel(t.tag)}
            </span>
            <span className="h-[7px] overflow-hidden rounded bg-secondary">
              <span
                className="block h-full rounded bg-primary/70"
                style={{ width: `${(t.count / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-mono text-[11px] font-semibold tabular-nums">
              {t.count}
            </span>
          </li>
        ))}
      </ul>
      {multiTagged > tagged && (
        <p className="text-[11px] text-muted-foreground">
          Una entrada puede llevar varias etiquetas, así que la suma es mayor que el
          número de entradas etiquetadas.
        </p>
      )}
    </section>
  );
}

function truncateList(items: string[], max: number): string {
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max}`;
}
