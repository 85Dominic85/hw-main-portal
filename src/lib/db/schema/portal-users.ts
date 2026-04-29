import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const portalSchema = pgSchema("portal");

export const portalUsers = portalSchema.table("portal_users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").notNull().default("viewer"), // 'admin' | 'viewer'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PortalUser = typeof portalUsers.$inferSelect;
export type NewPortalUser = typeof portalUsers.$inferInsert;
