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
  // Guard defensivo (además del de removeUser): nunca eliminar una fila cuyo
  // email esté en el allowlist — al quedar sin fila reentraría con la contraseña
  // de arranque (bootstrap per-email). Para revocar a un admin del allowlist hay
  // que desactivar su fila o sacarlo de PORTAL_ADMIN_EMAILS, no borrarla.
  const [row] = await db
    .select({ email: portalAccounts.email })
    .from(portalAccounts)
    .where(eq(portalAccounts.id, id))
    .limit(1);
  if (row && isAllowlistedAdmin(row.email)) {
    throw new Error(
      "No se puede eliminar una cuenta del allowlist de admins; desactívala en su lugar.",
    );
  }
  await db.delete(portalAccounts).where(eq(portalAccounts.id, id));
}

// ── Bootstrap (arranque per-email) ───────────────────────────────────────────

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

/**
 * True si el email está en PORTAL_ADMIN_EMAILS (los admins permanentes del
 * departamento). Estos emails siempre tienen acceso admin; si además tienen
 * cuenta en BD, esa fila manda (contraseña/estado/token_version).
 */
export function isAllowlistedAdmin(email: string): boolean {
  return adminAllowlist().includes(normalizeEmail(email));
}

/** Postgres 42P01 = relation does not exist (tabla 0005 sin migrar). */
function isUndefinedTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ((err as { code?: unknown }).code === "42P01") return true;
  const msg = (err as { message?: unknown }).message;
  return typeof msg === "string" && /does not exist|no existe/i.test(msg);
}

/**
 * Bootstrap PER-EMAIL: un email del allowlist (PORTAL_ADMIN_EMAILS) entra como
 * admin con la contraseña compartida SOLO mientras no tenga fila propia en
 * portal_accounts. NO es global: que existan otras cuentas no lo desactiva (eso
 * causaba el auto-lockout al crear el primer usuario). En cuanto ese email crea
 * su propia cuenta, su fila manda y esta función ya no se alcanza para él.
 *
 * Para revocar a un admin del allowlist: desactiva su fila (active=false, que
 * deniega en validateCredentials/resolveSession) o quítalo del env. Eliminar su
 * fila está bloqueado (deleteAccount/removeUser) para no reabrir esta puerta.
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
 *   (NO cae al bootstrap: la cuenta existe y manda).
 * - Sin fila para ese email → bootstrap PER-EMAIL: solo los emails del allowlist
 *   (PORTAL_ADMIN_EMAILS) entran con la contraseña compartida de arranque. Esto
 *   es per-email (no global): crear cuentas para otros NO desactiva tu arranque.
 *   En cuanto un admin del allowlist crea SU PROPIA cuenta, su fila manda y la
 *   contraseña compartida deja de servirle (este branch ya no se alcanza para él).
 * - Error transitorio de BD → null (fail-secure). Tabla sin migrar (42P01) →
 *   bootstrap (acc queda null).
 */
export async function validateCredentials(
  emailRaw: string,
  password: string,
): Promise<SessionPayload | null> {
  const email = normalizeEmail(emailRaw);

  let acc: PortalAccount | null = null;
  try {
    acc = await getAccountByEmail(email);
  } catch (err) {
    if (!isUndefinedTable(err)) return null; // fail-secure ante errores transitorios
  }

  if (acc) {
    if (!acc.active) return null;
    const ok = await verifyPassword(password, acc.passwordHash);
    return ok ? { email: acc.email, role: acc.role as SessionRole, tv: acc.tokenVersion } : null;
  }

  // Sin fila para este email → bootstrap per-email (solo allowlist + shared pw).
  return bootstrapCheck(email, password);
}

/**
 * Resuelve la sesión (de la cookie) contra el estado actual de la BD.
 * - Fila en BD: revalida active + rol + token_version (revocación inmediata).
 * - Sin fila → bootstrap per-email: un email del allowlist mantiene acceso admin
 *   aunque existan otras cuentas (no te bloqueas al crear usuarios). Para revocar
 *   a un admin del allowlist: desactiva su cuenta (deja fila inactive, que aquí
 *   deniega) o quítalo de PORTAL_ADMIN_EMAILS. Eliminar su fila está bloqueado
 *   en removeUser para no reabrir la puerta de arranque.
 * Fail-secure ante errores transitorios de BD.
 */
export async function resolveSession(
  payload: SessionPayload,
): Promise<{ email: string; role: SessionRole } | null> {
  const email = normalizeEmail(payload.email);

  let acc: PortalAccount | null = null;
  try {
    acc = await getAccountByEmail(email);
  } catch (err) {
    if (!isUndefinedTable(err)) return null; // error transitorio → fail-secure
  }

  if (acc) {
    if (!acc.active) return null;
    if (payload.tv !== acc.tokenVersion) return null; // cookie invalidada (pw/rol/estado)
    return { email: acc.email, role: acc.role as SessionRole };
  }

  // Sin fila → bootstrap per-email (ver nota en validateCredentials).
  return adminAllowlist().includes(email) ? { email, role: "admin" } : null;
}
