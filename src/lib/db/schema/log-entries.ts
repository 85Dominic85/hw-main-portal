import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { portalSchema } from "./portal-users";

/**
 * Bitácora del departamento — una fila por entrada diaria.
 *
 * Texto libre (TipTap en `body`) con etiquetas opcionales. Sustituye al
 * Google Doc donde el dpto registraba llamadas, incidencias y
 * configuraciones. El recopilatorio semanal se calcula al vuelo desde
 * estas filas (`summarizeWeek`), no se almacena.
 *
 * `authorEmail` sin FK a propósito: la identidad del portal es el email
 * (ver nota en sql/0009).
 *
 * `isoYear` / `isoWeek` / `isoDow` son columnas GENERADAS en BD — nunca
 * se escriben desde la app, de ahí `.generatedAlwaysAs()`.
 */
export const logEntries = portalSchema.table(
  "log_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryDate: date("entry_date").notNull(),
    authorEmail: text("author_email").notNull(),
    authorName: text("author_name"),
    title: text("title"),
    body: jsonb("body").notNull().default({ type: "doc", content: [] }),
    bodyText: text("body_text").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    client: text("client"),
    status: text("status"), // 'abierta' | 'resuelta' | 'seguimiento' | null
    highlight: boolean("highlight").notNull().default(false),
    isoYear: integer("iso_year").generatedAlwaysAs(
      sql`extract(isoyear from entry_date)::int`,
    ),
    isoWeek: integer("iso_week").generatedAlwaysAs(
      sql`extract(week from entry_date)::int`,
    ),
    isoDow: integer("iso_dow").generatedAlwaysAs(
      sql`extract(isodow from entry_date)::int`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("log_entries_date_idx").on(t.entryDate),
    index("log_entries_author_date_idx").on(t.authorEmail, t.entryDate),
    index("log_entries_week_idx").on(t.isoYear, t.isoWeek),
  ],
);

export type LogEntryRow = typeof logEntries.$inferSelect;
export type NewLogEntryRow = typeof logEntries.$inferInsert;

/** Estados posibles de una entrada. `null` = la entrada no tiene estado. */
export const LOG_ENTRY_STATUSES = ["abierta", "resuelta", "seguimiento"] as const;
export type LogEntryStatus = (typeof LOG_ENTRY_STATUSES)[number];
