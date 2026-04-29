import "server-only";

import { hwToolApiResponseSchema, hwToolHealthSchema } from "./schema";
import { mapHwToolResponse } from "./mapper";
import type { HwToolMetrics, HwToolPeriodFilter } from "./types";
import type { Result } from "@/lib/connectors/types";

/**
 * Cliente HTTP del connector HW Tool.
 *
 * - Usa header `x-api-key` (también acepta Bearer pero preferimos el específico).
 * - Timeout 8 segundos vía AbortSignal.
 * - Valida el shape con Zod y mapea a `HwToolMetrics`.
 * - Errores convertidos a `Result.error` con mensaje legible (sin leakear key).
 *
 * Llamado solo desde server (server query con `unstable_cache`). Marcar
 * `server-only` evita que se importe accidentalmente desde Client Components.
 */

interface HwToolClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

function getConfig(): HwToolClientConfig | null {
  const baseUrl = process.env.HWTOOL_ANALYTICS_API_URL;
  const apiKey = process.env.HWTOOL_ANALYTICS_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey, timeoutMs: 8000 };
}

function formatDate(d: Date): string {
  // YYYY-MM-DD en UTC para evitar saltos de zona horaria.
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
        "x-api-key": apiKey,
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
 * Llama a `?endpoint=health` para verificar que la edge function está viva.
 * Retorna `Result<{ schemaVersion: string; time: Date }>`.
 */
export async function healthcheckHwTool(): Promise<
  Result<{ schemaVersion: string; time: Date }>
> {
  const config = getConfig();
  if (!config) return { ok: false, error: "HWTOOL_ANALYTICS_API_URL/KEY no configuradas" };

  const url = `${config.baseUrl}?endpoint=health`;

  try {
    const res = await fetchWithTimeout(url, config.apiKey, config.timeoutMs!);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} en healthcheck` };
    }
    const json = await res.json();
    const parsed = hwToolHealthSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: "Health response shape inválido" };
    }
    return {
      ok: true,
      data: {
        schemaVersion: parsed.data.schema_version,
        time: new Date(parsed.data.time),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Llama a la API de métricas con filtros opcionales y devuelve `HwToolMetrics`.
 */
export async function fetchHwToolMetrics(
  filter: HwToolPeriodFilter = {},
): Promise<Result<HwToolMetrics>> {
  const config = getConfig();
  if (!config) return { ok: false, error: "HWTOOL_ANALYTICS_API_URL/KEY no configuradas" };

  const params = new URLSearchParams();
  if (filter.from) params.set("from", formatDate(filter.from));
  if (filter.to) params.set("to", formatDate(filter.to));
  if (filter.technician) params.set("technician", filter.technician);

  const url = `${config.baseUrl}${params.toString() ? `?${params}` : ""}`;

  try {
    const res = await fetchWithTimeout(url, config.apiKey, config.timeoutMs!);

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
    const parsed = hwToolApiResponseSchema.safeParse(json);
    if (!parsed.success) {
      // No leakeamos el body completo (puede traer datos sensibles); solo el path del error.
      const issues = parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return { ok: false, error: `Shape inesperado — ${issues}` };
    }

    return { ok: true, data: mapHwToolResponse(parsed.data) };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Timeout: la API de HW Tool tardó >8s" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
