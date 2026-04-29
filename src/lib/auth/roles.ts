/**
 * Detección de rol del portal a partir del email.
 *
 * Doble fuente de verdad:
 *   1. Tabla `portal.admin_emails` en BD (la fuente real, gestionada por trigger).
 *   2. Env var `PORTAL_ADMIN_EMAILS` (fallback en cliente para feedback rápido).
 *
 * En servidor, preferir `getCurrentUser()` que consulta `portal.portal_users.role`
 * o lee el JWT custom claim. Esta función es para casos donde aún no tenemos
 * sesión completa (login form) o defensa en profundidad.
 */

export type PortalRole = "admin" | "viewer";

const ADMIN_EMAILS = (process.env.PORTAL_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ALLOWLIST_DOMAIN = (
  process.env.PORTAL_EMAIL_ALLOWLIST_DOMAIN ?? "qamarero.com"
).toLowerCase();

export function isEmailAllowed(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return lower.endsWith(`@${ALLOWLIST_DOMAIN}`);
}

export function inferRoleFromEmail(email: string): PortalRole {
  const lower = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(lower) ? "admin" : "viewer";
}

export function isAdminRole(role: string | undefined | null): role is "admin" {
  return role === "admin";
}
