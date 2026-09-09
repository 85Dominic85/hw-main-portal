import {
  getIsoWeek,
  isoWeekToRange,
  type IsoWeekRange,
} from "@/lib/reports/iso-week";

/**
 * Semana laboral del departamento: LUNES A VIERNES.
 *
 * ── Por qué este módulo existe ──────────────────────────────────────────
 * `@/lib/reports/iso-week` trabaja con la semana ISO completa (lunes →
 * domingo) y lo consumen 9 ficheros de la feature de informes (listado,
 * viewer, editor, los 3 exports, server actions y el seed). Cambiar
 * `formatWeekLabel` allí para que cerrara en viernes reetiquetaría los
 * informes históricos ya publicados (W16-W19, W23, mayo 2026). Así que
 * `iso-week.ts` se deja intacto y la semana L–V vive aquí.
 *
 * ── La distinción que importa ───────────────────────────────────────────
 * Hay DOS conceptos de semana, a propósito:
 *
 *   · CAPTURA (lunes → domingo): el rango con el que se filtran las
 *     entradas. Se queda completo para que una urgencia atendida un
 *     sábado no caiga en un agujero entre semanas y se pierda.
 *
 *   · PRESENTACIÓN (lunes → viernes): lo que se pinta y sobre lo que se
 *     promedia. La cabecera cierra en viernes y la gráfica tiene 5 barras.
 *
 * Lo registrado en fin de semana no desaparece: sale en `offHours` del
 * resumen semanal, en una línea aparte, en lugar de meter dos columnas
 * vacías en la gráfica cada semana.
 */

/** Días laborables de la semana del departamento. */
export const WORK_DAYS_PER_WEEK = 5;

/** `iso_dow` de sábado y domingo (1=lunes … 7=domingo). */
export const WEEKEND_DOW = [6, 7] as const;

/** True si ese día ISO (1-7) es fin de semana. */
export function isWeekendDow(isoDow: number): boolean {
  return isoDow === 6 || isoDow === 7;
}

/**
 * Rango de CAPTURA de la semana: lunes 00:00 → domingo 23:59:59.999 UTC.
 * Reusa `isoWeekToRange` tal cual — es exactamente lo que hace falta.
 */
export function weekCaptureRange(isoYear: number, isoWeek: number): IsoWeekRange {
  return isoWeekToRange(isoYear, isoWeek);
}

/**
 * Los 5 días laborables de la semana, de lunes a viernes, como fechas UTC
 * a medianoche. Para pintar la gráfica y construir `byWorkDay`.
 */
export function workDays(isoYear: number, isoWeek: number): Date[] {
  const { from } = isoWeekToRange(isoYear, isoWeek);
  return Array.from({ length: WORK_DAYS_PER_WEEK }, (_, i) => {
    const d = new Date(from);
    d.setUTCDate(from.getUTCDate() + i);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
}

/** `YYYY-MM-DD` en UTC — la forma en que Postgres devuelve una columna `date`. */
export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Claves `YYYY-MM-DD` de los 5 días laborables, en orden. */
export function workDayKeys(isoYear: number, isoWeek: number): string[] {
  return workDays(isoYear, isoWeek).map(toDateKey);
}

/** Semana laboral en curso. */
export function currentWorkWeek(): { isoYear: number; isoWeek: number } {
  return getIsoWeek(new Date());
}

const DAY_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] as const;

/** Nombre corto del día a partir de `iso_dow` (1=lunes). */
export function dowShortLabel(isoDow: number): string {
  return DAY_SHORT[isoDow - 1] ?? "—";
}

/**
 * Etiqueta de la semana laboral: "Semana 36 · 31 ago – 4 sep 2026".
 *
 * Cierra en VIERNES, no en domingo — ahí está la diferencia con
 * `formatWeekLabel` de `iso-week.ts`, que se deja para los informes.
 */
export function formatWorkWeekLabel(isoYear: number, isoWeek: number): string {
  const days = workDays(isoYear, isoWeek);
  const monday = days[0];
  const friday = days[WORK_DAYS_PER_WEEK - 1];
  if (!monday || !friday) return `Semana ${isoWeek}`;

  const short = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const withYear = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `Semana ${isoWeek} · ${short.format(monday)} – ${withYear.format(friday)}`;
}

/** Etiqueta larga de un día: "jueves 3 sep". */
export function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}
