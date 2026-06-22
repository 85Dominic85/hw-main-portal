import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import type { PortalRole } from "./roles";
import { verifySession, SESSION_COOKIE } from "./session-cookie";
import { resolveSession } from "./accounts";

export interface PortalSessionUser {
  id: string;
  email: string;
  role: PortalRole;
  fullName: string | null;
  /** True si es un visitante anónimo (sin sesión). */
  isGuest: boolean;
}

const SESSION_USER_ID = "00000000-0000-0000-0000-000000000000";

const GUEST: PortalSessionUser = {
  id: "00000000-0000-0000-0000-00000000guest",
  email: "",
  role: "viewer",
  fullName: "Invitado",
  isGuest: true,
};

/**
 * Usuario actual a partir de la cookie de sesión firmada.
 *
 * - Sin cookie válida → invitado (solo ve la home).
 * - Con cookie válida → revalida el rol contra la tabla de cuentas
 *   (`resolveRoleForEmail`): si la cuenta se desactivó o dejó de ser admin,
 *   el cambio aplica al instante (no se confía en el rol "horneado" en la cookie).
 *
 * Cacheado por request con `cache()` de React.
 */
export const getCurrentUser = cache(async (): Promise<PortalSessionUser> => {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return GUEST;

  const resolved = await resolveSession(session);
  if (!resolved) return GUEST;

  return {
    id: SESSION_USER_ID,
    email: resolved.email,
    role: resolved.role,
    fullName: null,
    isGuest: false,
  };
});

/** Throws si no hay sesión autenticada (invitado incluido). */
export async function requireAuth(): Promise<PortalSessionUser> {
  const user = await getCurrentUser();
  if (user.isGuest) {
    throw new Error("UNAUTHORIZED: no hay sesión activa.");
  }
  return user;
}

/** Throws si no hay sesión o el usuario no es admin. */
export async function requireAdmin(): Promise<PortalSessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN: se requiere rol admin.");
  }
  return user;
}
