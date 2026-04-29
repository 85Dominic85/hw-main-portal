import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";

import { fetchMainOpsRawMetrics } from "@/lib/connectors/mainops/client";
import { mapMainOpsResponse } from "@/lib/connectors/mainops/mapper";
import type { MainOpsApiResponse } from "@/lib/connectors/mainops/schema";
import type { MainOpsMetrics, MainOpsPeriodFilter } from "@/lib/connectors/mainops";
import type { Result } from "@/lib/connectors/types";

const CACHE_TAG = "mainops-metrics";

class MainOpsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MainOpsApiError";
  }
}

/**
 * Devuelve métricas MainOps con cache de 60s (alineado con el
 * `Cache-Control: max-age=60` upstream).
 *
 * - Cachemos solo el RAW exitoso (JSON-serializable, sin Date).
 * - Si la API falla, throw → no se cachea → próxima request reintenta.
 * - Mapper se ejecuta fuera del cache para tener Date frescos.
 */
export async function getMainOpsSummary(
  filter: MainOpsPeriodFilter = {},
): Promise<Result<MainOpsMetrics>> {
  const fromKey = filter.from?.toISOString().slice(0, 10) ?? "all";
  const toKey = filter.to?.toISOString().slice(0, 10) ?? "all";
  const ptKey = filter.purchaseType ?? "all";
  const limKey = filter.recentLimit?.toString() ?? "10";
  const cacheKey = ["mainops", "metrics", fromKey, toKey, ptKey, limKey];

  try {
    const raw: MainOpsApiResponse = await unstable_cache(
      async () => {
        const result = await fetchMainOpsRawMetrics(filter);
        if (!result.ok) {
          throw new MainOpsApiError(result.error);
        }
        return result.data;
      },
      cacheKey,
      { revalidate: 60, tags: [CACHE_TAG] },
    )();

    return { ok: true, data: mapMainOpsResponse(raw) };
  } catch (err) {
    const error =
      err instanceof MainOpsApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Error desconocido";
    return { ok: false, error };
  }
}

export function invalidateMainOpsCache(): void {
  revalidateTag(CACHE_TAG);
}

/** Periodo "mes actual" por defecto (1º del mes UTC → ahora). */
export function currentMonthPeriod(): MainOpsPeriodFilter {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from, to: now };
}
