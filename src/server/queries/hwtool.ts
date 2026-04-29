import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";

import { fetchHwToolRawMetrics } from "@/lib/connectors/hwtool/client";
import { mapHwToolResponse } from "@/lib/connectors/hwtool/mapper";
import type { HwToolMetrics, HwToolPeriodFilter } from "@/lib/connectors/hwtool";
import type { Result } from "@/lib/connectors/types";

const CACHE_TAG = "hwtool-metrics";

/**
 * Devuelve métricas HW Tool con cache de 60s.
 *
 * Cacheamos el RAW (snake_case + ISO strings) que es 100% JSON-serializable,
 * y aplicamos el mapper FUERA del cache. Si meteramos `HwToolMetrics`
 * (con campos `Date`) en `unstable_cache`, los Date se convertirían a string
 * al deserializar y `m.generatedAt.toISOString()` petaría en runtime.
 *
 * El cache key incluye los filtros — distintos rangos tienen entradas
 * separadas. Se invalida con `invalidateHwToolCache()` cuando el usuario
 * pulsa "Actualizar" en el topbar.
 */
export async function getHwToolSummary(
  filter: HwToolPeriodFilter = {},
): Promise<Result<HwToolMetrics>> {
  const fromKey = filter.from?.toISOString().slice(0, 10) ?? "all";
  const toKey = filter.to?.toISOString().slice(0, 10) ?? "all";
  const techKey = filter.technician ?? "all";
  const cacheKey = ["hwtool", "metrics", fromKey, toKey, techKey];

  const cachedRaw = await unstable_cache(
    async () => fetchHwToolRawMetrics(filter),
    cacheKey,
    { revalidate: 60, tags: [CACHE_TAG] },
  )();

  if (!cachedRaw.ok) return cachedRaw;
  return { ok: true, data: mapHwToolResponse(cachedRaw.data) };
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
