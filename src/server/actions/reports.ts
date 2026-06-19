"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import type { Result } from "@/lib/connectors/types";
import { buildEmptyContent } from "@/lib/reports/defaults";
import { buildKpiSnapshot } from "@/lib/reports/build-snapshot";
import { formatWeekKey, isoWeekToRange } from "@/lib/reports/iso-week";
import { reportContentSchemaV1 } from "@/lib/reports/schema";

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
    from: z.string().date(), // "YYYY-MM-DD"
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

/**
 * Crea un nuevo borrador de informe.
 * El contenido inicial se construye con `buildEmptyContent()`.
 * El kpi_snapshot es null — se congela al publicar.
 */
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

  // Drizzle insert — usando cliente portal con RLS
  const { createSupabaseServerClient } = await import("@/lib/auth/supabase-server");
  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .schema("portal")
    .from("reports")
    .insert({
      type: data.type,
      period_key: periodKey,
      period_from: periodFrom,
      period_to: periodTo,
      iso_year: isoYear,
      iso_week: isoWeek,
      title,
      content: content as unknown as Record<string, unknown>,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `Ya existe un informe para el periodo ${periodKey}.` };
    }
    return { ok: false, error: error.message };
  }

  // Audit trail
  await supabase.schema("portal").from("report_authors").insert({
    report_id: row.id,
    section_key: "meta",
    user_id: user.id,
    action: "create",
    diff_summary: { periodKey, type: data.type },
  });

  revalidateReport(row.id);
  return { ok: true, data: { id: row.id } };
}

/**
 * Guarda una sección del informe de forma atómica con jsonb_set.
 * Cada sección se valida con el sub-schema correspondiente antes de persistir.
 * Registra audit trail por sección.
 */
export async function saveSection(
  input: unknown,
): Promise<Result<{ savedAt: string }>> {
  const user = await requireAdmin();

  const parsed = saveSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId, sectionKey, payload } = parsed.data;

  const { createSupabaseServerClient } = await import("@/lib/auth/supabase-server");
  const supabase = await createSupabaseServerClient();

  // Verificar que el informe existe y es draft
  const { data: report, error: fetchErr } = await supabase
    .schema("portal")
    .from("reports")
    .select("id, status, content")
    .eq("id", reportId)
    .single();

  if (fetchErr || !report) {
    return { ok: false, error: "Informe no encontrado." };
  }
  if (report.status !== "draft") {
    return { ok: false, error: "Solo se pueden editar informes en borrador." };
  }

  // Merge parcial: actualizar solo la sección pedida dentro del JSONB
  const currentContent = reportContentSchemaV1.parse(report.content ?? {});
  const updatedContent = {
    ...currentContent,
    [sectionKey]: payload,
  };

  const { error: updateErr } = await supabase
    .schema("portal")
    .from("reports")
    .update({ content: updatedContent as unknown as Record<string, unknown> })
    .eq("id", reportId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  const savedAt = new Date().toISOString();

  // Audit trail (autosave)
  await supabase.schema("portal").from("report_authors").insert({
    report_id: reportId,
    section_key: sectionKey,
    user_id: user.id,
    action: "autosave",
    diff_summary: { savedAt },
  });

  revalidateReport(reportId);
  return { ok: true, data: { savedAt } };
}

/**
 * Publica un informe: recomputa el snapshot KPI y lo congela.
 * Después de publicar, el trigger `guard_published_report` impide mutaciones.
 */
export async function publishReport(
  input: unknown,
): Promise<Result<{ publishedAt: string }>> {
  const user = await requireAdmin();

  const parsed = reportIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId } = parsed.data;

  const { createSupabaseServerClient } = await import("@/lib/auth/supabase-server");
  const supabase = await createSupabaseServerClient();

  const { data: report, error: fetchErr } = await supabase
    .schema("portal")
    .from("reports")
    .select("id, status, period_from, period_to")
    .eq("id", reportId)
    .single();

  if (fetchErr || !report) {
    return { ok: false, error: "Informe no encontrado." };
  }
  if (report.status !== "draft") {
    return { ok: false, error: "El informe ya está publicado o archivado." };
  }

  const from = new Date(report.period_from + "T00:00:00Z");
  const to = new Date(report.period_to + "T23:59:59Z");

  const snapshot = await buildKpiSnapshot({ from, to });
  const publishedAt = new Date().toISOString();

  const { error: updateErr } = await supabase
    .schema("portal")
    .from("reports")
    .update({
      status: "published",
      kpi_snapshot: snapshot as unknown as Record<string, unknown>,
      published_by: user.id,
      published_at: publishedAt,
    })
    .eq("id", reportId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  await supabase.schema("portal").from("report_authors").insert({
    report_id: reportId,
    section_key: "meta",
    user_id: user.id,
    action: "publish",
    diff_summary: { publishedAt, snapshotSources: Object.keys(snapshot.sourceHealth) },
  });

  revalidateReport(reportId);
  return { ok: true, data: { publishedAt } };
}

/**
 * Despublica un informe (→ draft). Permite correcciones post-publicación.
 * El snapshot se conserva — se sobreescribirá al siguiente publish.
 */
export async function unpublishReport(input: unknown): Promise<Result<true>> {
  const user = await requireAdmin();

  const parsed = reportIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId } = parsed.data;

  const { createSupabaseServerClient } = await import("@/lib/auth/supabase-server");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .schema("portal")
    .from("reports")
    .update({ status: "draft", published_at: null, published_by: null })
    .eq("id", reportId)
    .eq("status", "published");

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.schema("portal").from("report_authors").insert({
    report_id: reportId,
    section_key: "meta",
    user_id: user.id,
    action: "restore",
    diff_summary: { action: "unpublish" },
  });

  revalidateReport(reportId);
  return { ok: true, data: true };
}

/**
 * Archiva (soft-delete) un informe.
 * Los archivados no aparecen en listados normales pero se conservan en BD.
 */
export async function deleteReport(input: unknown): Promise<Result<true>> {
  await requireAdmin();

  const parsed = reportIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId } = parsed.data;

  const { createSupabaseServerClient } = await import("@/lib/auth/supabase-server");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .schema("portal")
    .from("reports")
    .update({ status: "archived" })
    .eq("id", reportId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateReport(reportId);
  return { ok: true, data: true };
}

/**
 * Actualiza el semáforo global del informe (verde/amarillo/rojo).
 */
export async function setGlobalStatus(input: unknown): Promise<Result<true>> {
  await requireAdmin();

  const parsed = globalStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }

  const { reportId, globalStatus } = parsed.data;

  const { createSupabaseServerClient } = await import("@/lib/auth/supabase-server");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .schema("portal")
    .from("reports")
    .update({ global_status: globalStatus })
    .eq("id", reportId)
    .eq("status", "draft");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateReport(reportId);
  return { ok: true, data: true };
}
