import { boolean, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { portalSchema } from "./portal-users";

/**
 * Cuentas de usuario del portal con contraseña propia (hash PBKDF2) y rol.
 * Gestionadas desde /admin/users. Sustituyen al Basic Auth de contraseña
 * compartida (que queda como fallback de arranque).
 */
export const portalAccounts = portalSchema.table("portal_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // 'admin' | 'viewer'
  active: boolean("active").notNull().default(true),
  tokenVersion: integer("token_version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PortalAccount = typeof portalAccounts.$inferSelect;
export type NewPortalAccount = typeof portalAccounts.$inferInsert;
