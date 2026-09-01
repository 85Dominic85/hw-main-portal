import {
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { portalSchema } from "./portal-users";

/**
 * Log de llamadas reales a los conectores externos (MainOps / HW Tool / HSM).
 * Una fila por cache-miss (llamada HTTP efectiva). Alimenta el inspector
 * "Fuentes". Se escribe best-effort desde `logConnectorFetch`.
 */
export const connectorFetchLog = portalSchema.table(
  "connector_fetch_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connector: text("connector").notNull(), // 'mainops' | 'hwtool' | 'hsm'
    url: text("url").notNull(),
    params: jsonb("params").notNull().default({}),
    ok: boolean("ok").notNull(),
    statusCode: integer("status_code"),
    latencyMs: integer("latency_ms").notNull(),
    bytes: integer("bytes"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("connector_fetch_log_connector_created_idx").on(t.connector, t.createdAt),
    index("connector_fetch_log_created_idx").on(t.createdAt),
  ],
);

export type ConnectorFetchLogEntry = typeof connectorFetchLog.$inferSelect;
export type NewConnectorFetchLogEntry = typeof connectorFetchLog.$inferInsert;
