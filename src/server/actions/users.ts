"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import {
  createAccount,
  updateAccount,
  setAccountPassword,
  deleteAccount,
  getAccountByEmail,
  listAccounts,
  normalizeEmail,
} from "@/lib/auth/accounts";
import type { Result } from "@/lib/connectors/types";

const roleEnum = z.enum(["admin", "viewer"]);

const createSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  name: z.string().trim().max(120).optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: roleEnum,
});

const idSchema = z.object({ id: z.string().uuid() });

/** Cuenta el resto de admins activos (excluyendo `exceptId`). */
async function otherActiveAdmins(exceptId: string): Promise<number> {
  const accounts = await listAccounts();
  return accounts.filter((a) => a.active && a.role === "admin" && a.id !== exceptId).length;
}

export async function createUser(input: unknown): Promise<Result<true>> {
  await requireAdmin();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { email, name, password, role } = parsed.data;

  const existing = await getAccountByEmail(email);
  if (existing) return { ok: false, error: "Ya existe una cuenta con ese email." };

  // Invariante anti-lockout: la primera cuenta (o cualquier cuenta mientras no
  // haya admins activos) debe ser admin, para no perder el acceso al crear solo
  // viewers (el bootstrap se desactiva en cuanto existe alguna cuenta).
  if (role !== "admin") {
    const accounts = await listAccounts();
    const activeAdmins = accounts.filter((a) => a.active && a.role === "admin").length;
    if (activeAdmins === 0) {
      return { ok: false, error: "Crea primero una cuenta admin (debe haber al menos un admin activo)." };
    }
  }

  try {
    await createAccount({ email, name: name ?? null, password, role });
    revalidatePath("/admin/users");
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear la cuenta." };
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(120).nullable().optional(),
  role: roleEnum.optional(),
  active: z.boolean().optional(),
});

export async function updateUser(input: unknown): Promise<Result<true>> {
  const admin = await requireAdmin();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { id, name, role, active } = parsed.data;

  const accounts = await listAccounts();
  const target = accounts.find((a) => a.id === id);
  if (!target) return { ok: false, error: "Cuenta no encontrada." };

  // Anti-lockout: no quitarte a ti mismo el admin/acceso, y no dejar 0 admins.
  const losingAdmin = (role && role !== "admin") || active === false;
  if (losingAdmin && target.role === "admin") {
    const isSelf = normalizeEmail(target.email) === normalizeEmail(admin.email);
    if (isSelf) {
      return { ok: false, error: "No puedes quitarte a ti mismo el acceso admin." };
    }
    if ((await otherActiveAdmins(id)) === 0) {
      return { ok: false, error: "Debe quedar al menos un admin activo." };
    }
  }

  try {
    await updateAccount(id, { name, role, active });
    revalidatePath("/admin/users");
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar." };
  }
}

const resetPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function resetUserPassword(input: unknown): Promise<Result<true>> {
  await requireAdmin();
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  try {
    await setAccountPassword(parsed.data.id, parsed.data.password);
    revalidatePath("/admin/users");
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cambiar la contraseña." };
  }
}

export async function removeUser(input: unknown): Promise<Result<true>> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const accounts = await listAccounts();
  const target = accounts.find((a) => a.id === parsed.data.id);
  if (!target) return { ok: false, error: "Cuenta no encontrada." };

  if (normalizeEmail(target.email) === normalizeEmail(admin.email)) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta." };
  }
  if (target.role === "admin" && target.active && (await otherActiveAdmins(target.id)) === 0) {
    return { ok: false, error: "Debe quedar al menos un admin activo." };
  }

  try {
    await deleteAccount(parsed.data.id);
    revalidatePath("/admin/users");
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar." };
  }
}
