import "server-only";

import { mainOpsApiResponseSchema, type MainOpsApiResponse } from "./schema";
import { mapMainOpsResponse } from "./mapper";
import type { MainOpsMetrics, MainOpsPeriodFilter } from "./types";
import type { Result } from "@/lib/connectors/types";

/**
 * Cliente HTTP del connector MainOps.
 *
 * - Header `X-API-Key` con `MAINOPS_API_KEY`. NO se expone al cliente.
 * - Timeout 15s vía AbortSignal.
 * - Valida shape con Zod y mapea a `MainOpsMetrics`.
 * - Errores convertidos a `Result.error` con mensaje legible (sin leakear key).
 *
 * Uso recomendado:
 *  - `fetchMainOpsRawMetrics()` dentro de `unstable_cache` (raw es JSON-safe).
 *  - `fetchMainOpsMetrics()` para usos directos sin cache.
 */

interface MainOpsClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

function getConfig(): MainOpsClientConfig | null {
  const baseUrl = process.env.MAINOPS_BASE_URL;
  const apiKey = process.env.MAINOPS_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey, timeoutMs: 15000 };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchWithTimeout(
  url: string,
  apiKey: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "content-type": "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Llama a la API y devuelve el shape RAW (snake_case + ISO strings).
 * 100% JSON-serializable → seguro para `unstable_cache`.
 */
export async function fetchMainOpsRawMetrics(
  filter: MainOpsPeriodFilter = {},
): Promise<Result<MainOpsApiResponse>> {
  const config = getConfig();
  if (!config) {
    return { ok: false, error: "MAINOPS_BASE_URL/API_KEY no configuradas" };
  }

  const params = new URLSearchParams();
  if (filter.from) params.set("from", formatDate(filter.from));
  if (filter.to) params.set("to", formatDate(filter.to));
  if (filter.purchaseType && filter.purchaseType !== "all") {
    params.set("purchase_type", filter.purchaseType);
  }
  if (typeof filter.recentLimit === "number") {
    params.set("recent_limit", String(filter.recentLimit));
  }

  const url = `${config.baseUrl}/api/external/metrics${params.toString() ? `?${params}` : ""}`;

  try {
    const res = await fetchWithTimeout(url, config.apiKey, config.timeoutMs);

    if (!res.ok) {
      let detail = "";
      try {
        const errBody = await res.json();
        detail = errBody?.detail ?? errBody?.error ?? "";
      } catch {
        /* body no JSON */
      }
      return {
        ok: false,
        error: `HTTP ${res.status}${detail ? ` — ${detail}` : ""}`,
      };
    }

    const json = await res.json();
    const parsed = mainOpsApiResponseSchema.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return { ok: false, error: `Shape inesperado — ${issues}` };
    }

    return { ok: true, data: parsed.data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Timeout: la API de MainOps tardó >15s" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Variante "lista para UI": fetchea raw + aplica mapper.
 * NO usar dentro de `unstable_cache` — los Date que crea el mapper
 * se serializan mal al cachear.
 */
export async function fetchMainOpsMetrics(
  filter: MainOpsPeriodFilter = {},
): Promise<Result<MainOpsMetrics>> {
  const raw = await fetchMainOpsRawMetrics(filter);
  if (!raw.ok) return raw;
  return { ok: true, data: mapMainOpsResponse(raw.data) };
}
