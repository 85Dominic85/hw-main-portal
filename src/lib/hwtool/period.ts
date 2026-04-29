/**
 * Helpers de periodo para HW Tool — neutrales a server/client.
 *
 * Antes vivían dentro de `hwtool-period-selector.tsx` (Client Component)
 * y `(portal)/hwtool/page.tsx` (Server Component) los importaba.
 * Eso provocaba "Attempted to call periodToFilter() from the server but
 * periodToFilter is on the client" en runtime, porque Next no puede
 * invocar funciones de un Client Component desde un Server Component.
 *
 * Solución: este módulo no tiene "use client" — funciona en ambos lados.
 */

export type HwToolPeriod = "today" | "7d" | "30d" | "month";

export const HWTOOL_VALID_PERIODS: readonly HwToolPeriod[] = [
  "today",
  "7d",
  "30d",
  "month",
] as const;

export const HWTOOL_DEFAULT_PERIOD: HwToolPeriod = "month";

export function isValidPeriod(period: string | null | undefined): period is HwToolPeriod {
  return HWTOOL_VALID_PERIODS.includes(period as HwToolPeriod);
}

/**
 * Traduce un preset de periodo a un rango {from, to} en UTC.
 * Las fechas se truncan a inicio de día UTC para coincidir con el campo
 * `fecha_hora` que la API filtra inclusive.
 */
export function periodToFilter(period: HwToolPeriod | null | undefined): {
  from?: Date;
  to?: Date;
} {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  switch (period) {
    case "today":
      return { from: today, to: now };
    case "7d": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 6);
      return { from, to: now };
    }
    case "30d": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from, to: now };
    }
    case "month":
    default: {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { from, to: now };
    }
  }
}
