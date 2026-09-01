import "server-only";

import { desc } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { ConnectorFetchLogEntry } from "@/lib/db/schema/connector-log";

/**
 * Últimas N llamadas registradas a los conectores (para el historial del
 * inspector "Fuentes"). Sin cache: `/fuentes` es force-dynamic.
 */
export async function getConnectorFetchLog(limit = 50): Promise<ConnectorFetchLogEntry[]> {
  return db
    .select()
    .from(schema.connectorFetchLog)
    .orderBy(desc(schema.connectorFetchLog.createdAt))
    .limit(limit);
}
