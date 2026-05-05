import "server-only";

import { hsmApiResponseSchema, type HsmApiResponse } from "./schema";
import { mapHsmResponse } from "./mapper";
import type { HsmMetrics, HsmPeriodFilter } from "./types";
import type { Result } from "@/lib/connectors/types";

/**
 * Cliente HTTP del connector HSM (mismo patrón que MainOps).
 *
 * - Header `X-API-Key` con `HSM_API_KEY`. NO se expone al cliente.
 * - Timeout 15s vía AbortSignal.
 * - Valida shape con Zod y mapea a `HsmMetrics`.
 * - Errores convertidos a `Result.error` con mensaje legible.
 *
 * Si las env vars `HSM_BASE_URL` / `HSM_API_KEY` no están configuradas
 * (estado inicial cuando el endpoint en HSM aún no existe), devuelve
 * `Result.error` con mensaje amistoso. El banner muestra escudo neutral
 * con "Conectando con HSM…" — no rompe la home.
 *
 * Uso recomendado:
 *  - `fetchHsmRawMetrics()` dentro de `unstable_cache` (raw es JSON-safe).
 *  - `fetchHsmMetrics()` para usos directos sin cache (ej. tests).
 */

interface HsmClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

function getConfig(): HsmClientConfig | null {
  const baseUrl = process.env.HSM_BASE_URL;
  const apiKey = process.env.HSM_API_KEY;
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
 * Llama a la API de HSM y devuelve el shape RAW (snake_case + ISO strings).
 * 100% JSON-serializable → seguro para `unstable_cache`.
 */
export async function fetchHsmRawMetrics(
  filter: HsmPeriodFilter = {},
): Promise<Result<HsmApiResponse>> {
  const config = getConfig();
  if (!config) {
    return {
      ok: false,
      error: "Conectando con HSM… (HSM_BASE_URL/API_KEY no configuradas)",
    };
  }

  const params = new URLSearchParams();
  if (filter.from) params.set("from", formatDate(filter.from));
  if (filter.to) params.set("to", formatDate(filter.to));

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
    const parsed = hsmApiResponseSchema.safeParse(json);
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
      return { ok: false, error: "Timeout: la API de HSM tardó >15s" };
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
export async function fetchHsmMetrics(
  filter: HsmPeriodFilter = {},
): Promise<Result<HsmMetrics>> {
  const raw = await fetchHsmRawMetrics(filter);
  if (!raw.ok) return raw;
  return { ok: true, data: mapHsmResponse(raw.data) };
}
