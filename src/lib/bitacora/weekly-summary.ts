import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import {
  WORK_DAYS_PER_WEEK,
  dowShortLabel,
  formatWorkWeekLabel,
  isWeekendDow,
  toDateKey,
  workDays,
} from "./work-week";

/**
 * Recopilatorio semanal de la bitácora.
 *
 * Función PURA: entran las filas de la semana, sale la estructura entera.
 * No toca BD, así que se testea sin infraestructura y se puede reutilizar tal
 * cual en el informe mensual cuando jota valide el formato.
 *
 * ── La idea ─────────────────────────────────────────────────────────────
 * Se rellena por persona (vista D) y el scorecard (vista C) se CALCULA de
 * lo mismo. Todo lo que hay aquí sale de las filas; las dos únicas cosas
 * que no se pueden deducir del texto (el estado de una incidencia y qué es
 * lo importante de la semana) vienen de los campos opcionales `status` y
 * `highlight` que se marcan al escribir.
 *
 * Las cuatro vistas del recopilatorio (cronológica, por temas, scorecard y
 * por personas) se sirven de este mismo objeto: cambiar de vista es
 * maquetación, no cálculo nuevo.
 */

export interface WeeklyAuthorTotal {
  email: string;
  name: string;
  entries: number;
}

export interface WeeklyDayBucket {
  /** `YYYY-MM-DD` */
  dateKey: string;
  /** 1=lunes … 5=viernes */
  isoDow: number;
  /** "LUN", "MAR", … */
  label: string;
  entries: LogEntryRow[];
}

export interface WeeklyGroup<K extends string = string> {
  key: K;
  entries: LogEntryRow[];
}

export interface WeeklySummary {
  isoYear: number;
  isoWeek: number;
  /** "Semana 36 · 31 ago – 4 sep 2026" — cierra en viernes. */
  label: string;

  // ── Capa C: el scorecard, todo calculado ──────────────────────────────
  totals: {
    entries: number;
    /** Entradas / 5 días laborables. NO / 7. */
    perWorkDay: number;
    clients: number;
    authors: WeeklyAuthorTotal[];
    incidents: {
      total: number;
      abiertas: number;
      resueltas: number;
      seguimiento: number;
    };
  };
  /** Exactamente 5 tramos, lunes→viernes, incluso los días sin entradas. */
  byWorkDay: WeeklyDayBucket[];
  /** Pico de entradas en un día — el máximo para escalar la gráfica. */
  peakDayEntries: number;
  /** Registrado en sábado o domingo: no entra en la gráfica, pero no se pierde. */
  offHours: LogEntryRow[];
  /** Etiquetas por frecuencia, descendente. */
  tagRanking: { tag: string; count: number }[];
  /** Entradas marcadas → bloque "Lo que hay que mirar". */
  highlights: LogEntryRow[];
  /** Entradas que siguen abiertas al cerrar la semana. */
  openItems: LogEntryRow[];
  /** Clientes/locales tocados, ordenados alfabéticamente. */
  clients: string[];

  // ── Capa A y vistas conmutables ───────────────────────────────────────
  /** Cronológico: todas las entradas de la semana, día ascendente. */
  chronological: LogEntryRow[];
  /** Vista por temas: un grupo por etiqueta, más frecuente primero. */
  byTag: WeeklyGroup[];
  /** Entradas sin ninguna etiqueta — "y lista el resto". */
  untagged: LogEntryRow[];
  /** Vista por personas: un grupo por autor, quien más escribió primero. */
  byAuthor: WeeklyGroup[];
}

/** Nombre a mostrar de un autor: su nombre si lo hay, si no la parte local del email. */
export function authorDisplayName(entry: {
  authorEmail: string;
  authorName: string | null;
}): string {
  if (entry.authorName?.trim()) return entry.authorName.trim();
  const [local = entry.authorEmail] = entry.authorEmail.split("@");
  return local;
}

/** `entry_date` puede llegar como string (columna `date` de postgres-js) o Date. */
function entryDateKey(entry: LogEntryRow): string {
  const raw: unknown = entry.entryDate;
  if (raw instanceof Date) return toDateKey(raw);
  return String(raw).slice(0, 10);
}

/**
 * `iso_dow` viene de una columna generada, pero se recalcula desde la fecha si
 * llegara nulo (fila insertada antes de la migración, o un mock de test que no
 * lo rellena). 1=lunes … 7=domingo.
 */
function entryDow(entry: LogEntryRow): number {
  if (typeof entry.isoDow === "number" && entry.isoDow >= 1 && entry.isoDow <= 7) {
    return entry.isoDow;
  }
  const d = new Date(`${entryDateKey(entry)}T00:00:00Z`);
  return ((d.getUTCDay() + 6) % 7) + 1;
}

export function summarizeWeek(
  entries: readonly LogEntryRow[],
  isoYear: number,
  isoWeek: number,
): WeeklySummary {
  const chronological = [...entries].sort((a, b) => {
    const byDate = entryDateKey(a).localeCompare(entryDateKey(b));
    if (byDate !== 0) return byDate;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  // ── Días laborables: 5 tramos fijos, aunque alguno quede vacío ────────
  const dayIndex = new Map<string, LogEntryRow[]>();
  const offHours: LogEntryRow[] = [];
  for (const entry of chronological) {
    if (isWeekendDow(entryDow(entry))) {
      offHours.push(entry);
      continue;
    }
    const key = entryDateKey(entry);
    const bucket = dayIndex.get(key);
    if (bucket) bucket.push(entry);
    else dayIndex.set(key, [entry]);
  }

  const byWorkDay: WeeklyDayBucket[] = workDays(isoYear, isoWeek).map((day, i) => {
    const dateKey = toDateKey(day);
    return {
      dateKey,
      isoDow: i + 1,
      label: dowShortLabel(i + 1),
      entries: dayIndex.get(dateKey) ?? [],
    };
  });

  const peakDayEntries = byWorkDay.reduce((max, d) => Math.max(max, d.entries.length), 0);

  // ── Autores ───────────────────────────────────────────────────────────
  const authorBuckets = new Map<string, { name: string; entries: LogEntryRow[] }>();
  for (const entry of chronological) {
    const email = entry.authorEmail;
    const existing = authorBuckets.get(email);
    if (existing) existing.entries.push(entry);
    else authorBuckets.set(email, { name: authorDisplayName(entry), entries: [entry] });
  }
  const authorsSorted = [...authorBuckets.entries()].sort(
    (a, b) => b[1].entries.length - a[1].entries.length || a[0].localeCompare(b[0]),
  );

  // ── Etiquetas ─────────────────────────────────────────────────────────
  const tagBuckets = new Map<string, LogEntryRow[]>();
  const untagged: LogEntryRow[] = [];
  for (const entry of chronological) {
    const tags = entry.tags ?? [];
    if (tags.length === 0) {
      untagged.push(entry);
      continue;
    }
    for (const tag of tags) {
      const bucket = tagBuckets.get(tag);
      if (bucket) bucket.push(entry);
      else tagBuckets.set(tag, [entry]);
    }
  }
  const tagsSorted = [...tagBuckets.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );

  // ── Clientes ──────────────────────────────────────────────────────────
  const clientSet = new Set<string>();
  for (const entry of chronological) {
    const client = entry.client?.trim();
    if (client) clientSet.add(client);
  }
  const clients = [...clientSet].sort((a, b) => a.localeCompare(b, "es"));

  // ── Incidencias por estado ────────────────────────────────────────────
  // Se cuentan las entradas CON estado, que es lo que se puede afirmar.
  // Una entrada sin estado no es "ni abierta ni cerrada": es que nadie lo marcó.
  const withStatus = chronological.filter((e) => e.status != null);
  const incidents = {
    total: withStatus.length,
    abiertas: withStatus.filter((e) => e.status === "abierta").length,
    resueltas: withStatus.filter((e) => e.status === "resuelta").length,
    seguimiento: withStatus.filter((e) => e.status === "seguimiento").length,
  };

  return {
    isoYear,
    isoWeek,
    label: formatWorkWeekLabel(isoYear, isoWeek),

    totals: {
      entries: chronological.length,
      // Media por día LABORABLE: divide entre 5 y cuenta solo lo registrado
      // de lunes a viernes. Meter aquí las entradas de fin de semana
      // inflaría una media que dice "por día laborable".
      perWorkDay:
        Math.round(
          ((chronological.length - offHours.length) / WORK_DAYS_PER_WEEK) * 10,
        ) / 10,
      clients: clients.length,
      authors: authorsSorted.map(([email, v]) => ({
        email,
        name: v.name,
        entries: v.entries.length,
      })),
      incidents,
    },
    byWorkDay,
    peakDayEntries,
    offHours,
    tagRanking: tagsSorted.map(([tag, list]) => ({ tag, count: list.length })),
    highlights: chronological.filter((e) => e.highlight),
    openItems: chronological.filter((e) => e.status === "abierta"),
    clients,

    chronological,
    byTag: tagsSorted.map(([tag, list]) => ({ key: tag, entries: list })),
    untagged,
    byAuthor: authorsSorted.map(([email, v]) => ({ key: email, entries: v.entries })),
  };
}
