"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Result } from "@/lib/connectors/types";
import { isEmptyDoc, tiptapToPlainText } from "@/lib/bitacora/body-text";
import { normalizeTags } from "@/lib/bitacora/tags";
import { getIsoWeek } from "@/lib/reports/iso-week";
import { formatWeekKey } from "@/lib/reports/iso-week";
import {
  createLogEntrySchema,
  deleteLogEntrySchema,
  updateLogEntrySchema,
} from "@/lib/validators/bitacora";

const { logEntries } = schema;

/**
 * Server actions de la bitácora.
 *
 * Patrón del portal: auth + role check ANTES del parse de input, `Result<T>`
 * como retorno y `revalidatePath` tras cada escritura.
 *
 * Propiedad de la entrada: cada autor solo puede editar o borrar LO SUYO,
 * aunque los tres del dpto sean admin. Eso se comprueba aquí comparando
 * `author_email` con el email de sesión — no en RLS, porque `portal_app` va
 * con BYPASSRLS y `auth.uid()` no está poblado para las cuentas de
 * `portal_accounts` (ver nota en sql/0009).
 */

/**
 * Nombre a guardar como autor de la entrada.
 *
 * `getCurrentUser()` devuelve siempre `fullName: null` (la sesión solo lleva
 * email y rol), así que el nombre se lee de `portal_accounts`. Un admin del
 * allowlist puede no tener fila (bootstrap per-email) → null, y entonces la UI
 * cae a la parte local del email. Se guarda como snapshot: si la cuenta cambia
 * de nombre, las entradas históricas conservan quién las firmó.
 */
async function resolveAuthorName(email: string): Promise<string | null> {
  try {
    const [acc] = await db
      .select({ name: schema.portalAccounts.name })
      .from(schema.portalAccounts)
      .where(eq(schema.portalAccounts.email, email))
      .limit(1);
    return acc?.name?.trim() || null;
  } catch {
    // Nombre es cosmético: si la consulta falla, la entrada se guarda igual.
    return null;
  }
}

function revalidateBitacora(entryDate: string) {
  revalidatePath("/bitacora");
  const { isoYear, isoWeek } = getIsoWeek(new Date(`${entryDate}T00:00:00Z`));
  revalidatePath(`/bitacora/semana/${formatWeekKey(isoYear, isoWeek)}`);
}

export async function createLogEntry(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const user = await requireAdmin();

  const parsed = createLogEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  // Una entrada sin título y sin cuerpo no dice nada: no se guarda.
  if (isEmptyDoc(data.body) && !data.title) {
    return { ok: false, error: "Escribe algo antes de guardar la entrada." };
  }

  const [row] = await db
    .insert(logEntries)
    .values({
      entryDate: data.entryDate,
      authorEmail: user.email,
      authorName: await resolveAuthorName(user.email),
      title: data.title,
      body: data.body,
      bodyText: tiptapToPlainText(data.body),
      tags: normalizeTags(data.tags),
      client: data.client,
      status: data.status,
      highlight: data.highlight,
    })
    .returning({ id: logEntries.id });

  if (!row) return { ok: false, error: "No se pudo guardar la entrada." };

  revalidateBitacora(data.entryDate);
  return { ok: true, data: { id: row.id } };
}

export async function updateLogEntry(input: unknown): Promise<Result<true>> {
  const user = await requireAdmin();

  const parsed = updateLogEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }
  const data = parsed.data;

  if (isEmptyDoc(data.body) && !data.title) {
    return { ok: false, error: "Escribe algo antes de guardar la entrada." };
  }

  const [existing] = await db
    .select({ authorEmail: logEntries.authorEmail, entryDate: logEntries.entryDate })
    .from(logEntries)
    .where(eq(logEntries.id, data.id))
    .limit(1);

  if (!existing) return { ok: false, error: "Esa entrada ya no existe." };
  if (existing.authorEmail !== user.email) {
    return { ok: false, error: "Solo puedes editar tus propias entradas." };
  }

  await db
    .update(logEntries)
    .set({
      entryDate: data.entryDate,
      title: data.title,
      body: data.body,
      bodyText: tiptapToPlainText(data.body),
      tags: normalizeTags(data.tags),
      client: data.client,
      status: data.status,
      highlight: data.highlight,
    })
    .where(eq(logEntries.id, data.id));

  // Si se cambió la fecha, hay que revalidar la semana vieja y la nueva.
  revalidateBitacora(existing.entryDate);
  if (existing.entryDate !== data.entryDate) revalidateBitacora(data.entryDate);

  return { ok: true, data: true };
}

export async function deleteLogEntry(input: unknown): Promise<Result<true>> {
  const user = await requireAdmin();

  const parsed = deleteLogEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const [existing] = await db
    .select({ authorEmail: logEntries.authorEmail, entryDate: logEntries.entryDate })
    .from(logEntries)
    .where(eq(logEntries.id, parsed.data.id))
    .limit(1);

  if (!existing) return { ok: true, data: true }; // ya no está: idempotente
  if (existing.authorEmail !== user.email) {
    return { ok: false, error: "Solo puedes borrar tus propias entradas." };
  }

  await db.delete(logEntries).where(eq(logEntries.id, parsed.data.id));

  revalidateBitacora(existing.entryDate);
  return { ok: true, data: true };
}
