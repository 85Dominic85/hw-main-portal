"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { db, schema } from "@/lib/db";
import type { Result } from "@/lib/connectors/types";
import { buildEmptyContent, parseReportContent } from "@/lib/reports/defaults";
import { buildKpiSnapshot } from "@/lib/reports/build-snapshot";
import { formatWeekKey, isoWeekToRange } from "@/lib/reports/iso-week";
import { reportContentSchemaV1, type ReportContent } from "@/lib/reports/schema";

const { reports, reportAuthors, portalUsers } = schema;

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

const setTitleSchema = z.object({
  reportId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function revalidateReport(id: string) {
  revalidateTag(`report-${id}`);
  revalidatePath("/reports");
}

async function ensurePortalUser(user: {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
}) {
  // El bypass user no tiene entrada en auth.users → FK violation.
  // Solo insertamos usuarios reales de Supabase Auth.
  if (AUTH_BYPASS_ENABLED) return;
  await db
    .insert(portalUsers)
    .values({
      id: user.id,
      email: user.email || `${user.id}@portal.internal`,
      role: user.role,
      fullName: user.fullName,
    })
    .onConflictDoNothing();
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createReport(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const user = await requireAdmin();
  await ensurePortalUser(user);

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
  // Autollenado del autor (editable a mano después). En bypass, user.email es
  // el email del Basic Auth admin; user.fullName suele ser null.
  content.author = user.fullName ?? user.email ?? "";
  const authorId = AUTH_BYPASS_ENABLED ? null : user.id;

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
        createdBy: authorId,
      })
      .returning({ id: reports.id });

    if (!row) return { ok: false, error: "No se pudo crear el informe." };

    await db.insert(reportAuthors).values({
      reportId: row.id,
      sectionKey: "meta",
      userId: authorId,
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
  await ensurePortalUser(user);

  const parsed = saveSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId, sectionKey, payload } = parsed.data;

  // Validar la sección y su payload antes de persistir, para no guardar
  // content malformado que luego rompería viewer/editor/export.
  const sectionShapes = reportContentSchemaV1.shape;
  if (sectionKey === "_version" || !(sectionKey in sectionShapes)) {
    return { ok: false, error: `Sección desconocida: ${sectionKey}` };
  }
  const sectionSchema = sectionShapes[
    sectionKey as keyof typeof sectionShapes
  ] as z.ZodTypeAny;
  const sectionParsed = sectionSchema.safeParse(payload);
  if (!sectionParsed.success) {
    return { ok: false, error: `Datos de sección inválidos: ${sectionParsed.error.message}` };
  }

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

  const currentContent = parseReportContent(report.content);
  const updatedContent = { ...currentContent, [sectionKey]: sectionParsed.data };

  await db
    .update(reports)
    .set({ content: updatedContent as unknown as Record<string, unknown> })
    .where(eq(reports.id, reportId));

  const savedAt = new Date().toISOString();

  await db.insert(reportAuthors).values({
    reportId,
    sectionKey,
    userId: AUTH_BYPASS_ENABLED ? null : user.id,
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
  await ensurePortalUser(user);

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
      publishedBy: AUTH_BYPASS_ENABLED ? null : user.id,
      publishedAt: publishedAtDate,
    })
    .where(eq(reports.id, reportId));

  await db.insert(reportAuthors).values({
    reportId,
    sectionKey: "meta",
    userId: AUTH_BYPASS_ENABLED ? null : user.id,
    action: "publish",
    diffSummary: { publishedAt },
  });

  revalidateReport(reportId);
  return { ok: true, data: { publishedAt } };
}

export async function unpublishReport(input: unknown): Promise<Result<true>> {
  const user = await requireAdmin();
  await ensurePortalUser(user);

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
    userId: AUTH_BYPASS_ENABLED ? null : user.id,
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

const cloneReportSchema = z.object({
  sourceReportId: z.string().uuid(),
  isoYear: z.number().int(),
  isoWeek: z.number().int().min(1).max(53),
});

const EMPTY_DOC = { type: "doc" as const, content: [] as [] };

function buildClonedContent(src: ReportContent): ReportContent {
  return {
    ...src,
    tesis: { doc: EMPTY_DOC },
    highlights: { doc: EMPTY_DOC },
    pabloComments: { doc: EMPTY_DOC },
    executiveSummary: {
      rows: src.executiveSummary.rows.map((r) => ({ ...r, actual: "", delta: "", comment: "" })),
    },
    amberRed: src.amberRed,
    blockers: src.blockers,
    decisions: { rows: src.decisions.rows.filter((r) => r.status !== "cerrada") },
    configuraciones: {
      ...src.configuraciones,
      totalConfigs: null,
      successRate1st: null,
      successRate2nd: null,
      problems: "",
    },
    envios: {
      ...src.envios,
      totalOps: null,
      completed: null,
      shipped: null,
      pending: null,
      grossRevenue: null,
      avgDeliveryDays: null,
      sla7dPct: null,
      orders: src.envios.orders.filter(
        (r) => r.status === "pendiente" || r.status === "bloqueado",
      ),
    },
    soporte: {
      ...src.soporte,
      openIncidents: null,
      activeRmas: null,
      sla7dPct: null,
      sla30dPct: null,
      reopenRatePct: null,
      avgResolutionHours: null,
      rmaResponseUnder2hPct: null,
      narrative: EMPTY_DOC,
    },
    cajones: src.cajones,
    performance: {
      members: src.performance.members.map((m) => ({
        ...m,
        kpis: m.kpis.map((k) => ({ ...k, value: "", status: "neutral" as const })),
        narrative: EMPTY_DOC,
      })),
    },
    nextFocus: src.nextFocus,
  };
}

export async function cloneReport(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const user = await requireAdmin();
  await ensurePortalUser(user);

  const parsed = cloneReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { sourceReportId, isoYear, isoWeek } = parsed.data;

  const [source] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, sourceReportId))
    .limit(1);

  if (!source) return { ok: false, error: "Informe origen no encontrado." };

  const sourceContent = parseReportContent(source.content);
  const clonedContent = buildClonedContent(sourceContent);

  const range = isoWeekToRange(isoYear, isoWeek);
  const periodKey = formatWeekKey(isoYear, isoWeek);
  const periodFrom = range.from.toISOString().slice(0, 10);
  const periodTo = range.to.toISOString().slice(0, 10);
  const title = `Informe ${periodKey}`;

  try {
    const [row] = await db
      .insert(reports)
      .values({
        type: "weekly",
        periodKey,
        periodFrom,
        periodTo,
        isoYear,
        isoWeek,
        title,
        content: clonedContent as unknown as Record<string, unknown>,
        parentReportId: sourceReportId,
        createdBy: AUTH_BYPASS_ENABLED ? null : user.id,
      })
      .returning({ id: reports.id });

    if (!row) return { ok: false, error: "No se pudo crear el informe." };

    await db.insert(reportAuthors).values({
      reportId: row.id,
      sectionKey: "meta",
      userId: AUTH_BYPASS_ENABLED ? null : user.id,
      action: "clone",
      diffSummary: { sourceReportId, periodKey },
    });

    revalidateReport(row.id);
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false, error: `Ya existe un informe para ${periodKey}.` };
    }
    return { ok: false, error: msg };
  }
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

export async function setReportTitle(input: unknown): Promise<Result<true>> {
  await requireAdmin();

  const parsed = setTitleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId, title } = parsed.data;

  await db.update(reports).set({ title }).where(eq(reports.id, reportId));

  revalidateReport(reportId);
  return { ok: true, data: true };
}
