/**
 * Helpers de periodo para HSM — neutrales server/client.
 * Mismo patrón que `lib/mainops/period.ts` y `lib/hwtool/period.ts`.
 *
 * Usados por la pestaña detalle `/hsm` y su selector. La home tiene su
 * propio helper `lib/home/period.ts` (decisión: selectores independientes).
 */

export type HsmPeriod = "today" | "7d" | "30d" | "month";

export const HSM_VALID_PERIODS: readonly HsmPeriod[] = [
  "today",
  "7d",
  "30d",
  "month",
] as const;

export const HSM_DEFAULT_PERIOD: HsmPeriod = "month";

export function isValidPeriod(period: string | null | undefined): period is HsmPeriod {
  return HSM_VALID_PERIODS.includes(period as HsmPeriod);
}

export function periodToFilter(period: HsmPeriod | null | undefined): {
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
