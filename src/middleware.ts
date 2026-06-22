import { NextResponse, type NextRequest } from "next/server";

import { verifySession, SESSION_COOKIE } from "@/lib/auth/session-cookie";

/**
 * Middleware del portal — control de acceso por cookie de sesión firmada.
 *
 *   - Público: home `/`, `/login`, `/api/auth/*`.
 *   - Solo admin: `/admin/*`, `/lab/*`.
 *   - Autenticado (admin o viewer): `/reports/*`.
 *   - Dashboards (`/mainops`, `/hwtool`, `/hsm`): se gatean a nivel de página
 *     (requireDashboardAccess) según el toggle "guest dashboards".
 *
 * El middleware solo VERIFICA la firma de la cookie (Edge, sin BD); el rol
 * efectivo se revalida contra la BD en getCurrentUser.
 */

function isAdminOnlyPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/lab" ||
    pathname.startsWith("/lab/")
  );
}

function isReportsPath(pathname: string): boolean {
  return pathname === "/reports" || pathname.startsWith("/reports/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminOnly = isAdminOnlyPath(pathname);
  const needsAuth = adminOnly || isReportsPath(pathname);
  if (!needsAuth) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (adminOnly && session.role !== "admin") {
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
