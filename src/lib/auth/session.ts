import "server-only";

import { cache } from "react";
import { headers, cookies } from "next/headers";

import { createSupabaseServerClient } from "./supabase-server";
import { inferRoleFromEmail, type PortalRole } from "./roles";
import { AUTH_BYPASS_ENABLED } from "./bypass";
import { validateBasicAuth } from "./admin-basic-auth";
import { verifyAdminToken, ADMIN_COOKIE } from "./admin-token";

export interface PortalSessionUser {
  id: string;
  email: string;
  role: PortalRole;
  fullName: string | null;
  /** True si es un visitante anónimo (portal abierto, sin auth real). */
  isGuest: boolean;
}

const BYPASS_USER_ID = "00000000-0000-0000-0000-000000000000";
const GUEST_USER_ID = "00000000-0000-0000-0000-00000000guest";

/**
 * Devuelve el usuario actual con su rol del portal.
 *
 * Estrategia de detección de rol (de mejor a peor):
 *   1. JWT custom claim `role` (lo setea el Auth Hook `set_role_claim_on_jwt`).
 *   2. Tabla `portal.portal_users.role` (consulta directa, fallback si no hay claim).
 *   3. Inferido del email vs `PORTAL_ADMIN_EMAILS` (último recurso).
 *
 * Cacheado por request via `cache()` de React: si una página llama a
 * `getCurrentUser()` 5 veces, se ejecuta una sola.
 */
export const getCurrentUser = cache(async (): Promise<PortalSessionUser | null> => {
  // Modo bypass — portal abierto para consulta. Identificamos al visitante:
  //   - Si la request actual lleva un Basic Auth header válido (estamos
  //     viendo /admin/* o el browser sigue mandando el header tras autenticar),
  //     devolvemos el user real con role admin.
  //   - Si no, devolvemos un "invitado": viewer sin email, fullName "Invitado".
  //     El UserMenu lo muestra como tal en lugar de inventar un "Demo admin".
  if (AUTH_BYPASS_ENABLED) {
    const headersList = await headers();
    const result = validateBasicAuth(headersList.get("authorization"));

    if (result.ok) {
      return {
        id: BYPASS_USER_ID,
        email: result.email,
        role: "admin",
        fullName: null,
        isGuest: false,
      };
    }

    // Cookie firmada: el admin autenticó vía Basic Auth en /admin o /reports
    // (donde el navegador sí envía el header); el middleware dejó la cookie
    // para reconocerlo también en el resto de páginas.
    const cookieStore = await cookies();
    const cookieEmail = await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
    // Revalidar contra la allowlist actual: si el email dejó de ser admin
    // (rotación/baja), la cookie firmada deja de conceder acceso al instante.
    if (cookieEmail && inferRoleFromEmail(cookieEmail) === "admin") {
      return {
        id: BYPASS_USER_ID,
        email: cookieEmail,
        role: "admin",
        fullName: null,
        isGuest: false,
      };
    }

    return {
      id: GUEST_USER_ID,
      email: "",
      role: "viewer",
      fullName: "Invitado",
      isGuest: true,
    };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  // 1. JWT claim (rápido, sin query)
  const claimRole = (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined);
  if (claimRole === "admin" || claimRole === "viewer") {
    return {
      id: user.id,
      email: user.email,
      role: claimRole,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
      isGuest: false,
    };
  }

  // 2. Query a portal.portal_users
  try {
    const { data: portalUser } = await supabase
      .schema("portal")
      .from("portal_users")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (portalUser?.role) {
      return {
        id: user.id,
        email: user.email,
        role: portalUser.role as PortalRole,
        fullName: portalUser.full_name ?? null,
        isGuest: false,
      };
    }
  } catch {
    // Si RLS impide leer (ej. JWT sin claim role aún), caemos al inferido.
  }

  // 3. Inferido del email
  return {
    id: user.id,
    email: user.email,
    role: inferRoleFromEmail(user.email),
    fullName: null,
    isGuest: false,
  };
});

/**
 * Igual que getCurrentUser pero throws si no hay sesión.
 * Útil en server actions y server components que requieren auth.
 */
export async function requireAuth(): Promise<PortalSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: no hay sesión activa.");
  }
  return user;
}

/**
 * Throws si no hay sesión o si el usuario no es admin.
 * Para mutaciones de datos propios del portal (umbrales, notas, metas, etc.).
 */
export async function requireAdmin(): Promise<PortalSessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN: se requiere rol admin.");
  }
  return user;
}
