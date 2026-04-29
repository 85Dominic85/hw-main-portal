import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "./supabase-server";
import { inferRoleFromEmail, type PortalRole } from "./roles";
import { AUTH_BYPASS_ENABLED, getBypassUser } from "./bypass";

export interface PortalSessionUser {
  id: string;
  email: string;
  role: PortalRole;
  fullName: string | null;
}

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
  // Modo bypass — entorno cerrado. Devuelve admin sintético sin tocar Supabase.
  if (AUTH_BYPASS_ENABLED) {
    const fake = getBypassUser();
    return fake
      ? { id: fake.id, email: fake.email, role: fake.role, fullName: fake.fullName }
      : null;
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
