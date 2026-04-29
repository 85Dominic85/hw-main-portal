/**
 * Modo abierto del portal — control de auth con env var.
 *
 * Por defecto el portal es **abierto** (sin login). Cualquiera con la URL
 * accede directo a la home con un usuario admin sintético.
 *
 * Para activar el flujo magic link de Supabase: setear la env var
 *   PORTAL_AUTH_REQUIRED=true
 * en Vercel (o `.env.local` en dev) y redeploy. Eso re-engancha el
 * middleware, el form de /login y la lectura de sesión real.
 *
 * Esta inversión permite iterar sobre producción cerrada sin tener que
 * configurar el Site URL/Redirect URLs en Supabase Auth.
 */

const AUTH_REQUIRED = process.env.PORTAL_AUTH_REQUIRED === "true";

/** True si el portal está en modo abierto (sin auth). */
export const AUTH_BYPASS_ENABLED = !AUTH_REQUIRED;

interface BypassUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin";
}

const BYPASS_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Devuelve el usuario sintético que se inyecta en modo abierto.
 * En modo "auth requerida" devuelve null (la sesión real la maneja Supabase).
 */
export function getBypassUser(): BypassUser | null {
  if (!AUTH_BYPASS_ENABLED) return null;

  const adminEmails = (process.env.PORTAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email = adminEmails[0] ?? "demo@qamarero.com";

  return {
    id: BYPASS_USER_ID,
    email,
    fullName: "Demo admin",
    role: "admin",
  };
}
