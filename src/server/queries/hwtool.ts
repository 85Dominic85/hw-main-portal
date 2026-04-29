import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";

import { fetchHwToolMetrics } from "@/lib/connectors/hwtool";
import type { HwToolMetrics, HwToolPeriodFilter } from "@/lib/connectors/hwtool";
import type { Result } from "@/lib/connectors/types";

const CACHE_TAG = "hwtool-metrics";

/**
 * Devuelve métricas HW Tool con cache de 60s.
 *
 * El cache key incluye los filtros serializados — distintos rangos
 * tienen entradas separadas. Se invalida con `invalidateHwToolCache()`
 * cuando el usuario pulsa "Actualizar" en el topbar.
 */
export async function getHwToolSummary(
  filter: HwToolPeriodFilter = {},
): Promise<Result<HwToolMetrics>> {
  const fromKey = filter.from?.toISOString().slice(0, 10) ?? "all";
  const toKey = filter.to?.toISOString().slice(0, 10) ?? "all";
  const techKey = filter.technician ?? "all";
  const cacheKey = ["hwtool", "metrics", fromKey, toKey, techKey];

  return unstable_cache(
    async () => fetchHwToolMetrics(filter),
    cacheKey,
    { revalidate: 60, tags: [CACHE_TAG] },
  )();
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
