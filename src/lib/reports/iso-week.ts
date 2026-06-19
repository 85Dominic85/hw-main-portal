/**
 * Helpers para semanas ISO 8601.
 *
 * Semana ISO: lunes a domingo. La semana 1 es la que contiene el primer
 * jueves del año. Años que empiezan en jueves o viernes pueden tener semana 53.
 *
 * Implementación con Date nativo + UTC — sin dependencias externas.
 */

export interface IsoWeekRange {
  from: Date; // lunes 00:00:00 UTC
  to: Date;   // domingo 23:59:59.999 UTC
  isoYear: number;
  isoWeek: number;
}

/**
 * Devuelve el día de la semana ISO (1=lunes … 7=domingo).
 */
function isoDow(d: Date): number {
  return ((d.getUTCDay() + 6) % 7) + 1;
}

/**
 * Semana ISO y año ISO de una fecha (puede diferir del año gregoriano
 * en la última semana de diciembre / primera de enero).
 */
export function getIsoWeek(date: Date): { isoYear: number; isoWeek: number } {
  // Nearest Thursday trick: la semana ISO pertenece al año del jueves.
  const thursday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  thursday.setUTCDate(thursday.getUTCDate() + (4 - isoDow(thursday)));

  const isoYear = thursday.getUTCFullYear();

  // Primer jueves del año ISO
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const firstThursday = new Date(jan4);
  firstThursday.setUTCDate(jan4.getUTCDate() + (4 - isoDow(jan4)));

  const isoWeek =
    Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000)) + 1;

  return { isoYear, isoWeek };
}

/**
 * Convierte (isoYear, isoWeek) a rango lunes-domingo UTC.
 */
export function isoWeekToRange(isoYear: number, isoWeek: number): IsoWeekRange {
  // Encontrar el lunes de esa semana:
  // El 4 de enero siempre está en la semana 1. Calculamos el lunes de W01.
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const mondayOfW1 = new Date(jan4);
  mondayOfW1.setUTCDate(jan4.getUTCDate() - (isoDow(jan4) - 1));

  const from = new Date(mondayOfW1);
  from.setUTCDate(mondayOfW1.getUTCDate() + (isoWeek - 1) * 7);

  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  to.setUTCHours(23, 59, 59, 999);

  return { from, to, isoYear, isoWeek };
}

/**
 * Devuelve el rango de la semana ISO actual (semana en curso).
 */
export function currentIsoWeekRange(): IsoWeekRange {
  const { isoYear, isoWeek } = getIsoWeek(new Date());
  return isoWeekToRange(isoYear, isoWeek);
}

/**
 * Formatea un period_key para semanas: "W22-2026".
 */
export function formatWeekKey(isoYear: number, isoWeek: number): string {
  return `W${isoWeek}-${isoYear}`;
}

/**
 * Parsea "W22-2026" → { isoYear: 2026, isoWeek: 22 }.
 * Devuelve null si el formato no coincide.
 */
export function parseWeekKey(key: string): { isoYear: number; isoWeek: number } | null {
  const match = /^W(\d{1,2})-(\d{4})$/.exec(key);
  if (!match || !match[1] || !match[2]) return null;
  return { isoWeek: parseInt(match[1], 10), isoYear: parseInt(match[2], 10) };
}

/**
 * Etiqueta legible: "Semana 22 · 26 mayo – 1 jun 2026".
 */
export function formatWeekLabel(isoYear: number, isoWeek: number): string {
  const { from, to } = isoWeekToRange(isoYear, isoWeek);
  const fmt = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const fmtYear = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Semana ${isoWeek} · ${fmt.format(from)} – ${fmtYear.format(to)}`;
}
