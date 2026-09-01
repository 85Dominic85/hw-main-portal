import "server-only";

import { db, schema } from "@/lib/db";

export type ConnectorName = "mainops" | "hwtool" | "hsm";

export interface ConnectorFetchLogInput {
  connector: ConnectorName;
  url: string;
  params: Record<string, unknown>;
  ok: boolean;
  statusCode?: number;
  latencyMs: number;
  bytes?: number | null;
  error?: string | null;
}

/** Enmascara posibles secretos en el query string (defensivo; la key va en header). */
function stripSecrets(url: string): string {
  return url.replace(/([?&](?:api[_-]?key|key|token|secret)=)[^&]*/gi, "$1***");
}

/**
 * Registra una llamada real a un conector en `portal.connector_fetch_log`.
 *
 * Best-effort: envuelto en try/catch — un fallo de log NUNCA rompe el fetch del
 * conector. Se invoca desde los clientes (`fetch*RawMetrics`), que solo se
 * ejecutan en cache-miss, así que el volumen es bajo y representa interacciones
 * reales con la herramienta.
 */
export async function logConnectorFetch(entry: ConnectorFetchLogInput): Promise<void> {
  try {
    await db.insert(schema.connectorFetchLog).values({
      connector: entry.connector,
      url: stripSecrets(entry.url),
      params: entry.params,
      ok: entry.ok,
      statusCode: entry.statusCode ?? null,
      latencyMs: Math.round(entry.latencyMs),
      bytes: entry.bytes ?? null,
      error: entry.error ?? null,
    });
  } catch {
    // El log es best-effort: no propagamos.
  }
}
