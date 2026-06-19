import "server-only";

import { db, schema } from "@/lib/db";
import { desc, eq, ne } from "drizzle-orm";

const { reports } = schema;

/**
 * Lista de informes para el panel.
 * - admins: ven todos (draft + published + archived).
 * - viewers: solo published.
 */
export async function listReports(role: "admin" | "viewer") {
  const baseQuery = db
    .select({
      id: reports.id,
      type: reports.type,
      periodKey: reports.periodKey,
      title: reports.title,
      status: reports.status,
      globalStatus: reports.globalStatus,
      isoYear: reports.isoYear,
      isoWeek: reports.isoWeek,
      createdAt: reports.createdAt,
      publishedAt: reports.publishedAt,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt))
    .limit(50);

  if (role === "viewer") {
    return baseQuery.where(eq(reports.status, "published"));
  }
  return baseQuery.where(ne(reports.status, "archived"));
}

/**
 * Un informe por ID.
 * Devuelve null si no existe o si el viewer intenta ver un draft.
 */
export async function getReportById(id: string, role: "admin" | "viewer") {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);

  const report = rows[0] ?? null;
  if (!report) return null;
  if (role === "viewer" && report.status !== "published") return null;
  return report;
}
