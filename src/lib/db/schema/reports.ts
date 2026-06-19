import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { portalSchema, portalUsers } from "./portal-users";

// Re-export for convenience
export { portalSchema };

export const reports = portalSchema.table(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(), // 'weekly' | 'monthly' | 'custom'
    periodKey: text("period_key").notNull(),
    periodFrom: date("period_from"),
    periodTo: date("period_to"),
    isoYear: integer("iso_year"),
    isoWeek: integer("iso_week"),
    status: text("status").notNull().default("draft"), // 'draft' | 'published' | 'archived'
    globalStatus: text("global_status"), // 'verde' | 'amarillo' | 'rojo'
    title: text("title").notNull(),
    content: jsonb("content").notNull().default({}),
    kpiSnapshot: jsonb("kpi_snapshot"),
    contentVersion: integer("content_version").notNull().default(1),
    parentReportId: uuid("parent_report_id"), // self-ref: FK defined at DB level
    createdBy: uuid("created_by")
      .references(() => portalUsers.id, { onDelete: "restrict" }),
    publishedBy: uuid("published_by").references(() => portalUsers.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reports_type_period_key_unique").on(t.type, t.periodKey),
    index("reports_status_idx").on(t.status),
    index("reports_created_by_idx").on(t.createdBy),
    index("reports_period_idx").on(t.type, t.periodFrom),
  ],
);

export const reportAuthors = portalSchema.table(
  "report_authors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sectionKey: text("section_key").notNull(),
    userId: uuid("user_id").references(() => portalUsers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(), // 'create' | 'edit' | 'autosave' | 'publish' | 'clone' | 'restore'
    diffSummary: jsonb("diff_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("report_authors_report_id_idx").on(t.reportId, t.createdAt),
    index("report_authors_user_id_idx").on(t.userId),
  ],
);

export const reportKpiDefinitions = portalSchema.table(
  "report_kpi_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kpiKey: text("kpi_key").notNull(),
    version: integer("version").notNull().default(1),
    label: text("label").notNull(),
    unit: text("unit"),
    source: text("source").notNull(), // 'mainops' | 'hwtool' | 'hsm' | 'manual'
    sectionKey: text("section_key").notNull(),
    target: numeric("target"),
    warnDelta: numeric("warn_delta"),
    dangerDelta: numeric("danger_delta"),
    direction: text("direction").notNull().default("higher-is-better"),
    owner: text("owner"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("report_kpi_def_key_version_unique").on(t.kpiKey, t.version),
    index("report_kpi_def_active_idx").on(t.sectionKey, t.active),
  ],
);

export const reportTemplates = portalSchema.table(
  "report_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    description: text("description"),
    type: text("type").notNull(), // 'weekly' | 'monthly' | 'custom'
    sections: jsonb("sections").notNull().default([]),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportAuthor = typeof reportAuthors.$inferSelect;
export type NewReportAuthor = typeof reportAuthors.$inferInsert;
export type ReportKpiDefinition = typeof reportKpiDefinitions.$inferSelect;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
