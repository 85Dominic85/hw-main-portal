"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Result } from "@/lib/connectors/types";
import { buildEmptyContent } from "@/lib/reports/defaults";
import { buildKpiSnapshot } from "@/lib/reports/build-snapshot";
import { formatWeekKey, isoWeekToRange } from "@/lib/reports/iso-week";
import { reportContentSchemaV1 } from "@/lib/reports/schema";

const { reports, reportAuthors } = schema;

// ── Input schemas ─────────────────────────────────────────────────────────────

const createReportSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("weekly"),
    isoYear: z.number().int(),
    isoWeek: z.number().int().min(1).max(53),
  }),
  z.object({
    type: z.literal("monthly"),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
  }),
  z.object({
    type: z.literal("custom"),
    from: z.string().date(),
    to: z.string().date(),
  }),
]);

const saveSectionSchema = z.object({
  reportId: z.string().uuid(),
  sectionKey: z.string().min(1),
  payload: z.unknown(),
});

const reportIdSchema = z.object({ reportId: z.string().uuid() });

const globalStatusSchema = z.object({
  reportId: z.string().uuid(),
  globalStatus: z.enum(["verde", "amarillo", "rojo"]),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function revalidateReport(id: string) {
  revalidateTag(`report-${id}`);
  revalidatePath("/reports");
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createReport(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const user = await requireAdmin();

  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const data = parsed.data;

  let periodKey: string;
  let periodFrom: string;
  let periodTo: string;
  let isoYear: number | null = null;
  let isoWeek: number | null = null;
  let title: string;

  if (data.type === "weekly") {
    const range = isoWeekToRange(data.isoYear, data.isoWeek);
    isoYear = data.isoYear;
    isoWeek = data.isoWeek;
    periodKey = formatWeekKey(data.isoYear, data.isoWeek);
    periodFrom = range.from.toISOString().slice(0, 10);
    periodTo = range.to.toISOString().slice(0, 10);
    title = `Informe ${periodKey}`;
  } else if (data.type === "monthly") {
    periodKey = `${data.year}-${String(data.month).padStart(2, "0")}`;
    periodFrom = `${data.year}-${String(data.month).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(data.year, data.month, 0)).getUTCDate();
    periodTo = `${data.year}-${String(data.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    title = `Informe ${periodKey}`;
  } else {
    periodKey = `${data.from}--${data.to}`;
    periodFrom = data.from;
    periodTo = data.to;
    title = `Informe ${data.from} → ${data.to}`;
  }

  const content = buildEmptyContent();

  try {
    const [row] = await db
      .insert(reports)
      .values({
        type: data.type,
        periodKey,
        periodFrom,
        periodTo,
        isoYear,
        isoWeek,
        title,
        content: content as unknown as Record<string, unknown>,
        createdBy: user.id,
      })
      .returning({ id: reports.id });

    if (!row) return { ok: false, error: "No se pudo crear el informe." };

    await db.insert(reportAuthors).values({
      reportId: row.id,
      sectionKey: "meta",
      userId: user.id,
      action: "create",
      diffSummary: { periodKey, type: data.type },
    });

    revalidateReport(row.id);
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false, error: `Ya existe un informe para el periodo ${periodKey}.` };
    }
    return { ok: false, error: msg };
  }
}

export async function saveSection(
  input: unknown,
): Promise<Result<{ savedAt: string }>> {
  const user = await requireAdmin();

  const parsed = saveSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId, sectionKey, payload } = parsed.data;

  const existing = await db
    .select({ status: reports.status, content: reports.content })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  const report = existing[0];
  if (!report) return { ok: false, error: "Informe no encontrado." };
  if (report.status !== "draft") {
    return { ok: false, error: "Solo se pueden editar informes en borrador." };
  }

  const currentContent = reportContentSchemaV1.parse(report.content ?? {});
  const updatedContent = { ...currentContent, [sectionKey]: payload };

  await db
    .update(reports)
    .set({ content: updatedContent as unknown as Record<string, unknown> })
    .where(eq(reports.id, reportId));

  const savedAt = new Date().toISOString();

  await db.insert(reportAuthors).values({
    reportId,
    sectionKey,
    userId: user.id,
    action: "autosave",
    diffSummary: { savedAt },
  });

  revalidateReport(reportId);
  return { ok: true, data: { savedAt } };
}

export async function publishReport(
  input: unknown,
): Promise<Result<{ publishedAt: string }>> {
  const user = await requireAdmin();

  const parsed = reportIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId } = parsed.data;

  const existing = await db
    .select({ status: reports.status, periodFrom: reports.periodFrom, periodTo: reports.periodTo })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  const report = existing[0];
  if (!report) return { ok: false, error: "Informe no encontrado." };
  if (report.status !== "draft") {
    return { ok: false, error: "El informe ya está publicado o archivado." };
  }

  const from = new Date((report.periodFrom ?? "") + "T00:00:00Z");
  const to = new Date((report.periodTo ?? "") + "T23:59:59Z");
  const snapshot = await buildKpiSnapshot({ from, to });
  const publishedAtDate = new Date();
  const publishedAt = publishedAtDate.toISOString();

  await db
    .update(reports)
    .set({
      status: "published",
      kpiSnapshot: snapshot as unknown as Record<string, unknown>,
      publishedBy: user.id,
      publishedAt: publishedAtDate,
    })
    .where(eq(reports.id, reportId));

  await db.insert(reportAuthors).values({
    reportId,
    sectionKey: "meta",
    userId: user.id,
    action: "publish",
    diffSummary: { publishedAt },
  });

  revalidateReport(reportId);
  return { ok: true, data: { publishedAt } };
}

export async function unpublishReport(input: unknown): Promise<Result<true>> {
  const user = await requireAdmin();

  const parsed = reportIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId } = parsed.data;

  await db
    .update(reports)
    .set({ status: "draft", publishedAt: null, publishedBy: null })
    .where(and(eq(reports.id, reportId), eq(reports.status, "published")));

  await db.insert(reportAuthors).values({
    reportId,
    sectionKey: "meta",
    userId: user.id,
    action: "restore",
    diffSummary: { action: "unpublish" },
  });

  revalidateReport(reportId);
  return { ok: true, data: true };
}

export async function deleteReport(input: unknown): Promise<Result<true>> {
  await requireAdmin();

  const parsed = reportIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId } = parsed.data;

  await db
    .update(reports)
    .set({ status: "archived" })
    .where(eq(reports.id, reportId));

  revalidateReport(reportId);
  return { ok: true, data: true };
}

export async function setGlobalStatus(input: unknown): Promise<Result<true>> {
  await requireAdmin();

  const parsed = globalStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId, globalStatus } = parsed.data;

  await db
    .update(reports)
    .set({ globalStatus })
    .where(and(eq(reports.id, reportId), eq(reports.status, "draft")));

  revalidateReport(reportId);
  return { ok: true, data: true };
}
