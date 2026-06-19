"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Result } from "@/lib/connectors/types";

const { reportKpiDefinitions } = schema;

// ── Schemas ───────────────────────────────────────────────────────────────────

const kpiDefSchema = z.object({
  id: z.string().uuid().optional(),
  kpiKey: z.string().min(1).max(64),
  label: z.string().min(1).max(128),
  unit: z.string().max(32).optional(),
  source: z.enum(["mainops", "hwtool", "hsm", "manual"]),
  sectionKey: z.string().min(1).max(64),
  target: z.number().nullable().optional(),
  warnDelta: z.number().nullable().optional(),
  dangerDelta: z.number().nullable().optional(),
  direction: z.enum(["higher-is-better", "lower-is-better"]).default("higher-is-better"),
  owner: z.string().max(64).optional(),
});

// ── Actions ───────────────────────────────────────────────────────────────────

export type KpiDefInput = z.infer<typeof kpiDefSchema>;

export async function upsertKpiDefinition(
  input: unknown,
): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const parsed = kpiDefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const { id, target, warnDelta, dangerDelta, ...rest } = parsed.data;

  const values = {
    ...rest,
    target: target != null ? String(target) : null,
    warnDelta: warnDelta != null ? String(warnDelta) : null,
    dangerDelta: dangerDelta != null ? String(dangerDelta) : null,
  };

  try {
    if (id) {
      await db
        .update(reportKpiDefinitions)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(reportKpiDefinitions.id, id));

      revalidatePath("/admin/kpi-targets");
      return { ok: true, data: { id } };
    }

    const [row] = await db
      .insert(reportKpiDefinitions)
      .values({ ...values, version: 1 })
      .returning({ id: reportKpiDefinitions.id });

    if (!row) return { ok: false, error: "No se pudo crear la definición." };

    revalidatePath("/admin/kpi-targets");
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false, error: `Ya existe una definición con la clave "${rest.kpiKey}".` };
    }
    return { ok: false, error: msg };
  }
}

export async function toggleKpiDefinitionActive(
  id: string,
  active: boolean,
): Promise<Result<true>> {
  await requireAdmin();

  await db
    .update(reportKpiDefinitions)
    .set({ active, updatedAt: new Date() })
    .where(eq(reportKpiDefinitions.id, id));

  revalidatePath("/admin/kpi-targets");
  return { ok: true, data: true };
}

export async function deleteKpiDefinition(id: string): Promise<Result<true>> {
  await requireAdmin();

  await db
    .delete(reportKpiDefinitions)
    .where(and(eq(reportKpiDefinitions.id, id), eq(reportKpiDefinitions.active, false)));

  revalidatePath("/admin/kpi-targets");
  return { ok: true, data: true };
}
