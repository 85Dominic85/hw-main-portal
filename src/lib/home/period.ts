/**
 * Helpers de periodo para la home (selector global sobre los 3 escudos).
 * Neutrales server/client — importables desde Server Components y Client Components.
 *
 * Decisiones (2026-04-30):
 *   - Default: `month` = mes natural en curso (1 del mes UTC → ahora). Coherente con
 *     el comportamiento histórico de los banners.
 *   - Presets rolling 7d / 15d / 30d cuentan desde HOY hacia atrás (today-N+1 → ahora).
 *   - `custom` lee `?from=YYYY-MM-DD&to=YYYY-MM-DD` del querystring. Se valida.
 *   - El selector de la home NO afecta a las pestañas detalle (`/mainops`, `/hwtool`)
 *     que mantienen su propio selector.
 */

export type HomePeriod = "month" | "7d" | "15d" | "30d" | "custom";

export const HOME_VALID_PERIODS: readonly HomePeriod[] = [
  "month",
  "7d",
  "15d",
  "30d",
  "custom",
] as const;

export const HOME_DEFAULT_PERIOD: HomePeriod = "month";

export function isValidHomePeriod(s: string | null | undefined): s is HomePeriod {
  return HOME_VALID_PERIODS.includes(s as HomePeriod);
}

export interface HomePeriodRange {
  from: Date;
  to: Date;
  /** Etiqueta legible del rango activo (ej. "Mes en curso", "Últimos 15 días", "21/04 → 30/04"). */
  label: string;
  /** Periodo efectivo aplicado (puede caer al default si custom es inválido). */
  effective: HomePeriod;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parsea una fecha YYYY-MM-DD como UTC midnight.
 * Devuelve null si el string es inválido o la fecha no es real (e.g. "2026-13-99").
 */
function parseIsoDate(s: string | null | undefined): Date | null {
  if (!s || !ISO_DATE_RE.test(s)) return null;
  const [y, m, d] = s.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/**
 * Devuelve `date` formateado como YYYY-MM-DD en UTC (sin hora).
 * Útil para escribir el query string del selector.
 */
export function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Formato corto día/mes (ej. "21/04") en es-ES, robusto a SSR. */
function formatDayMonth(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}

/**
 * Calcula el rango efectivo para un periodo del selector.
 * Si `period === "custom"` y `customFrom`/`customTo` son válidos, usa esas
 * fechas. Si no, cae al default (`month`).
 */
export function homePeriodToRange(
  period: HomePeriod | null | undefined,
  customFrom?: string | null,
  customTo?: string | null,
): HomePeriodRange {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  // Helper para construir un rango rolling de N días incluyendo hoy.
  const rolling = (days: number): { from: Date; to: Date } => {
    const from = new Date(today);
    from.setUTCDate(from.getUTCDate() - (days - 1));
    return { from, to: now };
  };

  switch (period) {
    case "7d": {
      const r = rolling(7);
      return { ...r, label: "Últimos 7 días", effective: "7d" };
    }
    case "15d": {
      const r = rolling(15);
      return { ...r, label: "Últimos 15 días", effective: "15d" };
    }
    case "30d": {
      const r = rolling(30);
      return { ...r, label: "Últimos 30 días", effective: "30d" };
    }
    case "custom": {
      const from = parseIsoDate(customFrom);
      const to = parseIsoDate(customTo);
      if (from && to && from.getTime() <= to.getTime()) {
        // Cap superior a `now` para no consultar futuro.
        const cappedTo = to.getTime() > now.getTime() ? now : to;
        return {
          from,
          to: cappedTo,
          label: `${formatDayMonth(from)} → ${formatDayMonth(to)}`,
          effective: "custom",
        };
      }
      // Custom inválido → fallback al default.
      const from0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return {
        from: from0,
        to: now,
        label: "Mes en curso",
        effective: "month",
      };
    }
    case "month":
    default: {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { from, to: now, label: "Mes en curso", effective: "month" };
    }
  }
}

/**
 * Genera una key estable a partir del rango. Útil como `key` de un Suspense
 * boundary para forzar el re-fetch de los banners cuando cambia el periodo.
 */
export function rangeKey(range: HomePeriodRange): string {
  return `${range.effective}-${dateToIso(range.from)}-${dateToIso(range.to)}`;
}

/**
 * Rango fijo "últimos 30 días rolling" para el HERO de los escudos del home.
 *
 * Decisión 2026-05-06: el hero del escudo debe ser un termómetro estable de
 * la salud del depto, NO un dato sensible al rango pequeño que el user elija
 * en el selector global. Si el selector está en "Mes en curso" durante los
 * primeros días del mes, el hero se llena de NaN/100% por default y deja de
 * ser informativo. Fijar 30d garantiza que siempre haya datos relevantes.
 *
 * Las 3 líneas de updates bajo el escudo SÍ siguen el selector global, así
 * el user puede explorar sub-periodos sin que el hero se vuelva inestable.
 */
export function last30DaysFilter(): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 29);
  return { from, to: now };
}
