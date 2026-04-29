/**
 * Formatos numéricos y de fecha del portal.
 * Locale fija a "es-ES" porque el UI es en español.
 */

const PERCENT_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
});

const RELATIVE_TIME = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });

export function formatPercent(value: number): string {
  // value en rango 0-1
  return PERCENT_FORMATTER.format(value);
}

export function formatPercentFromBase100(value: number): string {
  // value en rango 0-100
  return PERCENT_FORMATTER.format(value / 100);
}

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 60) return RELATIVE_TIME.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return RELATIVE_TIME.format(diffMin, "minute");
  if (Math.abs(diffHour) < 24) return RELATIVE_TIME.format(diffHour, "hour");
  return RELATIVE_TIME.format(diffDay, "day");
}
