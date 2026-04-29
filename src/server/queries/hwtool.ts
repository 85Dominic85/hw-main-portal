import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";

import { fetchHwToolRawMetrics } from "@/lib/connectors/hwtool/client";
import { mapHwToolResponse } from "@/lib/connectors/hwtool/mapper";
import type { HwToolApiResponse } from "@/lib/connectors/hwtool/schema";
import type { HwToolMetrics, HwToolPeriodFilter } from "@/lib/connectors/hwtool";
import type { Result } from "@/lib/connectors/types";

const CACHE_TAG = "hwtool-metrics";

/**
 * Error que el cache de Next NO guarda — `unstable_cache` ignora throws,
 * así que el siguiente request reintenta fresh contra la API.
 *
 * Sin esto, un timeout transitorio de Vercel (cold start, glitch de red)
 * quedaba cached 60s y bloqueaba el banner/pestaña aunque la API ya
 * estuviera respondiendo en <1s.
 */
class HwToolApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HwToolApiError";
  }
}

/**
 * Devuelve métricas HW Tool con cache de 60s.
 *
 * - Solo cachemos el RAW exitoso (snake_case + ISO strings) → JSON-serializable.
 * - Si la API falla, throw → no se cachea → próxima request reintenta.
 * - El mapper se ejecuta FUERA del cache para construir los `Date`
 *   frescos en cada request.
 *
 * Cache key incluye los filtros (incluido crm_test) — distintos rangos
 * tienen entradas separadas. Se invalida con `invalidateHwToolCache()`.
 */
export async function getHwToolSummary(
  filter: HwToolPeriodFilter = {},
): Promise<Result<HwToolMetrics>> {
  const fromKey = filter.from?.toISOString().slice(0, 10) ?? "all";
  const toKey = filter.to?.toISOString().slice(0, 10) ?? "all";
  const techKey = filter.technician ?? "all";
  const crmKey =
    typeof filter.crmTest === "boolean" ? String(filter.crmTest) : "all";
  const cacheKey = ["hwtool", "metrics", fromKey, toKey, techKey, crmKey];

  try {
    const raw: HwToolApiResponse = await unstable_cache(
      async () => {
        const result = await fetchHwToolRawMetrics(filter);
        if (!result.ok) {
          throw new HwToolApiError(result.error);
        }
        return result.data;
      },
      cacheKey,
      { revalidate: 60, tags: [CACHE_TAG] },
    )();

    return { ok: true, data: mapHwToolResponse(raw) };
  } catch (err) {
    const error =
      err instanceof HwToolApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Error desconocido";
    return { ok: false, error };
  }
}

/**
 * Invalida el cache HW Tool. Llamar desde el botón "Actualizar".
 */
export function invalidateHwToolCache(): void {
  revalidateTag(CACHE_TAG);
}

/**
 * Construye un periodo "mes actual" por defecto (1º del mes → hoy).
 */
export function currentMonthPeriod(): HwToolPeriodFilter {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from, to: now };
}
