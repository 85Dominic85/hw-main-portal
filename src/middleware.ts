import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware del portal.
 *
 * Sprint 0 (actual): permisivo — solo registra la ruta y deja pasar.
 * Sprint 1: integrará Supabase Auth — leerá la cookie de sesión y
 * redirigirá a /login si no hay usuario válido. La allowlist
 * `@qamarero.com` se verifica en el callback de signup, no aquí.
 */

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Excluye assets estáticos, _next/* y rutas API públicas (callback auth).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/callback|.*\\..*).*)",
  ],
};
