import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/auth/supabase-middleware";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { requireAdminBasicAuth } from "@/lib/auth/admin-basic-auth";

/**
 * Middleware del portal.
 *
 * Reglas:
 *   - **`/admin/*`**: SIEMPRE pide HTTP Basic Auth (independiente del bypass).
 *     Solo jj.gallego@ y domingo.bueno@ pueden gestionar umbrales, notas,
 *     metas y manual entries. Credenciales en env vars PORTAL_ADMIN_EMAILS
 *     y PORTAL_ADMIN_PASSWORD.
 *   - Si `PORTAL_AUTH_BYPASS=true`: deja pasar todo el resto. Modo abierto.
 *   - Rutas públicas: `/login`, `/api/auth/callback`. Cualquiera entra.
 *   - Resto: requieren sesión Supabase válida (cuando Supabase Auth esté
 *     activo). Si no, redirect a `/login`.
 *   - Si ya estás logueado y entras a `/login`, te manda a `/`.
 *
 * El allowlist `@qamarero.com` se aplica en el trigger SQL `handle_new_auth_user`,
 * no aquí — un email no permitido nunca llega a tener sesión.
 */

const PUBLIC_PATHS = ["/login", "/api/auth/callback", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  // /admin/* siempre protegido con Basic Auth, antes que cualquier otra regla.
  // Esto permite que el portal funcione en modo abierto para el resto pero
  // mantenga las páginas admin tras credenciales.
  if (isAdminPath(request.nextUrl.pathname)) {
    const authError = requireAdminBasicAuth(request);
    if (authError) return authError;
    // Auth OK → cae al flujo normal (en bypass o con Supabase).
  }

  // Modo abierto (default): deja pasar todo y, si alguien entra a /login,
  // lo redirige a la home (no hay form que rellenar).
  if (AUTH_BYPASS_ENABLED) {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // Sin Supabase configurado (Sprint 0 sin .env.local) → no bloquees nada.
  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logueado y va a /login → redirect a home
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // No logueado y la ruta no es pública → redirect a /login
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    // Preserva el destino para volver tras login
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Excluye assets estáticos, _next, favicons, manifests.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
