/**
 * Bypass de autenticación para entornos cerrados de producción/staging.
 *
 * Cuando `PORTAL_AUTH_BYPASS=true` está en las env vars:
 *   - El middleware no exige sesión Supabase.
 *   - `getCurrentUser()` devuelve un usuario admin sintético.
 *   - El topbar muestra un banner amarillo claramente visible.
 *   - El botón "Cerrar sesión" del UserMenu queda deshabilitado.
 *
 * El bypass NO debe usarse cuando el portal sea accesible al exterior.
 * Está pensado solo como medida temporal mientras arreglamos config de
 * Supabase Auth o cuando estamos iterando contra producción cerrada.
 *
 * Para desactivar: borrar la env var en Vercel y redeploy.
 */

export const AUTH_BYPASS_ENABLED = process.env.PORTAL_AUTH_BYPASS === "true";

interface BypassUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin";
}

const BYPASS_USER_ID = "00000000-0000-0000-0000-000000000000";

export function getBypassUser(): BypassUser | null {
  if (!AUTH_BYPASS_ENABLED) return null;

  const adminEmails = (process.env.PORTAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email = adminEmails[0] ?? "bypass@qamarero.com";

  return {
    id: BYPASS_USER_ID,
    email,
    fullName: "Bypass admin",
    role: "admin",
  };
}
