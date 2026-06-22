import "server-only";

import { eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import type { SessionPayload, SessionRole } from "./session-cookie";
import type { PortalAccount } from "@/lib/db/schema/accounts";

const { portalAccounts } = schema;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getAccountByEmail(email: string): Promise<PortalAccount | null> {
  const [row] = await db
    .select()
    .from(portalAccounts)
    .where(eq(portalAccounts.email, normalizeEmail(email)))
    .limit(1);
  return row ?? null;
}

export async function listAccounts(): Promise<PortalAccount[]> {
  return db.select().from(portalAccounts).orderBy(portalAccounts.email);
}

export async function countAccounts(): Promise<number> {
  const rows = await db.select({ id: portalAccounts.id }).from(portalAccounts);
  return rows.length;
}

export async function createAccount(input: {
  email: string;
  name: string | null;
  password: string;
  role: SessionRole;
}): Promise<void> {
  await db.insert(portalAccounts).values({
    email: normalizeEmail(input.email),
    name: input.name,
    passwordHash: await hashPassword(input.password),
    role: input.role,
  });
}

export async function updateAccount(
  id: string,
  patch: { name?: string | null; role?: SessionRole; active?: boolean },
): Promise<void> {
  await db
    .update(portalAccounts)
    .set({
      ...patch,
      // Invalida cookies previas ante cualquier cambio de rol/estado.
      tokenVersion: sql`${portalAccounts.tokenVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(portalAccounts.id, id));
}

export async function setAccountPassword(id: string, password: string): Promise<void> {
  await db
    .update(portalAccounts)
    .set({
      passwordHash: await hashPassword(password),
      // Cambiar contraseña cierra las sesiones existentes.
      tokenVersion: sql`${portalAccounts.tokenVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(portalAccounts.id, id));
}

export async function deleteAccount(id: string): Promise<void> {
  await db.delete(portalAccounts).where(eq(portalAccounts.id, id));
}

// ── Bootstrap (arranque sin cuentas) ─────────────────────────────────────────

function constTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function adminAllowlist(): string[] {
  return (process.env.PORTAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Postgres 42P01 = relation does not exist (tabla 0005 sin migrar). */
function isUndefinedTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ((err as { code?: unknown }).code === "42P01") return true;
  const msg = (err as { message?: unknown }).message;
  return typeof msg === "string" && /does not exist|no existe/i.test(msg);
}

/**
 * El bootstrap (los 3 emails admin con la contraseña compartida) solo está
 * activo cuando NO existe ninguna cuenta (tabla vacía) o la tabla aún no se ha
 * migrado. En cuanto se crea la primera cuenta, manda exclusivamente la BD
 * (evita que borrar/degradar una cuenta deje una puerta trasera por env).
 */
function bootstrapCheck(email: string, password: string): SessionPayload | null {
  const sharedPw = process.env.PORTAL_ADMIN_PASSWORD;
  if (!sharedPw) return null;
  if (adminAllowlist().includes(email) && constTimeEqual(password, sharedPw)) {
    return { email, role: "admin", tv: 0 };
  }
  return null;
}

/**
 * Valida credenciales del formulario de login.
 * - Cuenta en BD: verifica hash + active. Si la contraseña no cuadra → null
 *   (NO cae al bootstrap: la cuenta existe).
 * - Sin cuenta y tabla vacía/inexistente → bootstrap.
 * - Cualquier OTRO error de BD → null (fail-secure).
 */
export async function validateCredentials(
  emailRaw: string,
  password: string,
): Promise<SessionPayload | null> {
  const email = normalizeEmail(emailRaw);

  let acc: PortalAccount | null = null;
  let tableMissing = false;
  try {
    acc = await getAccountByEmail(email);
  } catch (err) {
    if (isUndefinedTable(err)) tableMissing = true;
    else return null; // fail-secure ante errores transitorios de BD
  }

  if (acc) {
    if (!acc.active) return null;
    const ok = await verifyPassword(password, acc.passwordHash);
    return ok ? { email: acc.email, role: acc.role as SessionRole, tv: acc.tokenVersion } : null;
  }

  if (!tableMissing) {
    let count: number;
    try {
      count = await countAccounts();
    } catch {
      return null; // fail-secure
    }
    if (count > 0) return null; // ya hay cuentas → bootstrap desactivado
  }

  return bootstrapCheck(email, password);
}

/**
 * Resuelve la sesión (de la cookie) contra el estado actual de la BD.
 * Revalida active + rol + token_version (revocación inmediata). Devuelve el
 * usuario o null (→ invitado). Fail-secure ante errores de BD.
 */
export async function resolveSession(
  payload: SessionPayload,
): Promise<{ email: string; role: SessionRole } | null> {
  const email = normalizeEmail(payload.email);

  let acc: PortalAccount | null = null;
  let tableMissing = false;
  try {
    acc = await getAccountByEmail(email);
  } catch (err) {
    if (isUndefinedTable(err)) tableMissing = true;
    else return null;
  }

  if (acc) {
    if (!acc.active) return null;
    if (payload.tv !== acc.tokenVersion) return null; // cookie invalidada
    return { email: acc.email, role: acc.role as SessionRole };
  }

  if (!tableMissing) {
    let count: number;
    try {
      count = await countAccounts();
    } catch {
      return null;
    }
    if (count > 0) return null;
  }

  return adminAllowlist().includes(email) ? { email, role: "admin" } : null;
}
