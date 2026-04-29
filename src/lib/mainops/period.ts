/**
 * Helpers de periodo para MainOps — neutrales server/client.
 * Mismo patrón que `lib/hwtool/period.ts` para evitar el bug de
 * "Attempted to call X() from the server but X is on the client".
 */

export type MainOpsPeriod = "today" | "7d" | "30d" | "month";

export const MAINOPS_VALID_PERIODS: readonly MainOpsPeriod[] = [
  "today",
  "7d",
  "30d",
  "month",
] as const;

export const MAINOPS_DEFAULT_PERIOD: MainOpsPeriod = "month";

export function isValidPeriod(period: string | null | undefined): period is MainOpsPeriod {
  return MAINOPS_VALID_PERIODS.includes(period as MainOpsPeriod);
}

export function periodToFilter(period: MainOpsPeriod | null | undefined): {
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
