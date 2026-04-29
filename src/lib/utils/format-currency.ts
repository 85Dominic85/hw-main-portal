/**
 * Formato de moneda en euros con locale es-ES.
 * Compacta valores grandes: 12.500 €, 1,2M €, 56.230 €.
 */

const FULL_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const FULL_FORMATTER_2DEC = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPACT_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatEur(value: number, opts: { decimals?: 0 | 2 } = {}): string {
  return opts.decimals === 2
    ? FULL_FORMATTER_2DEC.format(value)
    : FULL_FORMATTER.format(value);
}

export function formatEurCompact(value: number): string {
  if (Math.abs(value) < 1000) return formatEur(value);
  return COMPACT_FORMATTER.format(value);
}
