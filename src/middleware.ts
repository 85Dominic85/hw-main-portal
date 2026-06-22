import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/auth/supabase-middleware";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { requireAdminBasicAuth, validateBasicAuth } from "@/lib/auth/admin-basic-auth";
import { signAdminToken, ADMIN_COOKIE } from "@/lib/auth/admin-token";

/**
 * Middleware del portal.
 *
 * Reglas de acceso:
 *   - **`/admin/*` y `/reports/*`**: SIEMPRE requieren HTTP Basic Auth. Son la
 *     parte privada del departamento — solo las 3 cuentas (jj.gallego,
 *     domingo.bueno, guillermo.mateos) con la contraseña compartida.
 *   - **Home (`/`)**: pública (hero shields).
 *   - **Dashboards (`/mainops`, `/hwtool`, `/hsm`)**: gated a nivel de página
 *     según el toggle "guest dashboards" (admin lo controla). No se bloquean
 *     aquí porque el middleware (Edge) no puede leer ese flag de la BD.
 *   - Al validar un Basic Auth correcto, se setea una cookie firmada
 *     (`portal_admin`) para que `getCurrentUser` reconozca al admin en TODAS
 *     las páginas (el header Basic Auth no se reenvía a rutas no challenged).
 *   - Si `PORTAL_AUTH_REQUIRED=true`: flujo Supabase (login real).
 */

const PUBLIC_PATHS = ["/login", "/api/auth/callback", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Rutas privadas del departamento: requieren Basic Auth. */
function isPrivatePath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/reports" ||
    pathname.startsWith("/reports/") ||
    pathname === "/lab" ||
    pathname.startsWith("/lab/")
  );
}

async function attachAdminCookie(res: NextResponse, email: string): Promise<void> {
  const token = await signAdminToken(email);
  if (token) {
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      // En dev/preview sin HTTPS el navegador descartaría una cookie Secure,
      // dejando al admin sin reconocer fuera de /admin y /reports.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12h
    });
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basic = validateBasicAuth(request.headers.get("authorization"));

  // Parte privada: Basic Auth obligatorio (independiente del bypass).
  if (isPrivatePath(pathname) && !basic.ok) {
    return requireAdminBasicAuth(request); // 401 (prompt) o 503 (sin config)
  }

  // Modo abierto (default).
  if (AUTH_BYPASS_ENABLED) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const res = NextResponse.next();
    if (basic.ok) await attachAdminCookie(res, basic.email);
    return res;
  }

  // Flujo Supabase (PORTAL_AUTH_REQUIRED=true).
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  if (!supabase) {
    if (basic.ok) await attachAdminCookie(response, basic.email);
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (basic.ok) await attachAdminCookie(response, basic.email);
  return response;
}

export const config = {
  // Excluye assets estáticos, _next, favicons, manifests.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
