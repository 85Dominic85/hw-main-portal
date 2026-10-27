import { NextResponse, type NextRequest } from "next/server";

import { verifySession, SESSION_COOKIE } from "@/lib/auth/session-cookie";

/**
 * Middleware del portal — control de acceso por cookie de sesión firmada.
 *
 *   - Público: `/login` y `/api/*` (cada route valida la sesión por su cuenta).
 *   - Solo admin: `/admin/*`, `/fuentes/*`, `/bitacora/*`, `/lab/*`.
 *   - Todo lo demás (home y dashboards incluidos) exige sesión (admin o viewer):
 *     sin sesión no se ve ningún dato, se aterriza en el login.
 *
 * El middleware solo VERIFICA la firma de la cookie (Edge, sin BD); el rol
 * efectivo se revalida contra la BD en getCurrentUser.
 */

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    // Internos de Next (HMR, overlay de errores en dev).
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/__nextjs")
  );
}

function isAdminOnlyPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/fuentes" ||
    pathname.startsWith("/fuentes/") ||
    pathname === "/bitacora" ||
    pathname.startsWith("/bitacora/") ||
    pathname === "/lab" ||
    pathname.startsWith("/lab/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminOnlyPath(pathname) && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluye assets estáticos, _next, favicons, manifests.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
