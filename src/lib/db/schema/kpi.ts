import {
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { portalSchema, portalUsers } from "./portal-users";

export const kpiThresholds = portalSchema.table("kpi_thresholds", {
  id: uuid("id").primaryKey().defaultRandom(),
  kpiId: text("kpi_id").notNull().unique(),
  warnValue: numeric("warn_value"),
  dangerValue: numeric("danger_value"),
  direction: text("direction").notNull().default("lower-is-worse"),
  notes: text("notes"),
  updatedBy: uuid("updated_by").references(() => portalUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kpiNotes = portalSchema.table("kpi_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  kpiId: text("kpi_id").notNull(),
  body: text("body").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => portalUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kpiGoals = portalSchema.table(
  "kpi_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kpiId: text("kpi_id").notNull(),
    periodYear: integer("period_year").notNull(),
    periodMonth: integer("period_month").notNull(),
    targetValue: numeric("target_value").notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => portalUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueKpiPeriod: unique().on(t.kpiId, t.periodYear, t.periodMonth),
  }),
);

export const manualEntries = portalSchema.table("manual_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  kpiId: text("kpi_id").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  value: numeric("value").notNull(),
  description: text("description"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => portalUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exportLog = portalSchema.table("export_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => portalUsers.id, { onDelete: "restrict" }),
  exportKind: text("export_kind").notNull(),
  filters: jsonb("filters").notNull().default({}),
  rowCount: integer("row_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KpiThreshold = typeof kpiThresholds.$inferSelect;
export type KpiNote = typeof kpiNotes.$inferSelect;
export type KpiGoal = typeof kpiGoals.$inferSelect;
export type ManualEntry = typeof manualEntries.$inferSelect;
export type ExportLogEntry = typeof exportLog.$inferSelect;
