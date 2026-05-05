import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";

import { fetchHsmRawMetrics } from "@/lib/connectors/hsm/client";
import { mapHsmResponse } from "@/lib/connectors/hsm/mapper";
import type { HsmApiResponse } from "@/lib/connectors/hsm/schema";
import type { HsmMetrics, HsmPeriodFilter } from "@/lib/connectors/hsm";
import type { Result } from "@/lib/connectors/types";

const CACHE_TAG = "hsm-metrics";

/**
 * Error que el cache de Next NO guarda — `unstable_cache` ignora throws,
 * así que el siguiente request reintenta fresh contra HSM.
 *
 * Crítico aquí: en el estado inicial el endpoint HSM aún no existe, así
 * que TODOS los requests fallan (404 / "no configurada"). Sin throw-no-cache
 * ese error quedaría cached 60s por rango, agravando el problema.
 */
class HsmApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HsmApiError";
  }
}

/**
 * Devuelve métricas HSM con cache de 60s.
 *
 * - Solo cachemos el RAW exitoso (snake_case + ISO strings) → JSON-serializable.
 * - Si la API falla, throw → no se cachea → próxima request reintenta.
 * - El mapper se ejecuta FUERA del cache para construir los `Date`
 *   y el `slaDeltaPp` frescos en cada request.
 */
export async function getHsmSummary(
  filter: HsmPeriodFilter = {},
): Promise<Result<HsmMetrics>> {
  const fromKey = filter.from?.toISOString().slice(0, 10) ?? "all";
  const toKey = filter.to?.toISOString().slice(0, 10) ?? "all";
  const cacheKey = ["hsm", "metrics", fromKey, toKey];

  try {
    const raw: HsmApiResponse = await unstable_cache(
      async () => {
        const result = await fetchHsmRawMetrics(filter);
        if (!result.ok) {
          throw new HsmApiError(result.error);
        }
        return result.data;
      },
      cacheKey,
      { revalidate: 60, tags: [CACHE_TAG] },
    )();

    return { ok: true, data: mapHsmResponse(raw) };
  } catch (err) {
    const error =
      err instanceof HsmApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Error desconocido";
    return { ok: false, error };
  }
}

/**
 * Invalida el cache HSM. Llamar desde el botón "Actualizar" o tras
 * mutaciones que afecten al periodo activo.
 */
export function invalidateHsmCache(): void {
  revalidateTag(CACHE_TAG);
}

/**
 * Construye un periodo "mes actual" por defecto (1º del mes UTC → ahora).
 * Mismo patrón que `currentMonthPeriod()` de mainops y hwtool.
 */
export function currentMonthPeriod(): HsmPeriodFilter {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from, to: now };
}
