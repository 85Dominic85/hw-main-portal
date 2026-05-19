import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP Basic Auth para rutas administrativas del portal.
 *
 * El portal está en modo abierto (consulta) para todo el mundo. Las rutas
 * `/admin/*` son la excepción: requieren credenciales para que solo los
 * admins (jj.gallego, domingo.bueno) puedan gestionar umbrales, notas,
 * metas y manual entries.
 *
 * Decisión 2026-05-07: HTTP Basic Auth en lugar de form propio porque:
 *   - 0 dependencias nuevas; nativo del navegador.
 *   - Stateless: cada request lleva el header, no hay cookies que gestionar.
 *   - El navegador recuerda las credenciales durante la sesión.
 *   - Suficiente para 2 usuarios fijos sin lógica de roles.
 *
 * Config (Vercel env vars, NO en código):
 *   - `PORTAL_ADMIN_EMAILS` — lista CSV de emails autorizados.
 *   - `PORTAL_ADMIN_PASSWORD` — password compartida.
 *
 * Si `PORTAL_ADMIN_PASSWORD` no está configurada, el helper devuelve 503
 * con mensaje claro (en lugar de bloquear silenciosamente).
 *
 * Cuando se quiera reactivar Supabase Auth con allowlist real, este helper
 * puede coexistir o reemplazarse — sólo afecta a `/admin/*`.
 */

const REALM = "HW Main Portal — Admin";

function unauthorizedResponse(message?: string): NextResponse {
  return new NextResponse(message ?? "Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function serviceUnavailableResponse(message: string): NextResponse {
  return new NextResponse(message, {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Compara dos strings en tiempo constante para mitigar timing attacks.
 * Devuelve false si los lengths difieren (sin revelar info).
 */
function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verifica las credenciales Basic Auth contra la allowlist + password
 * compartida. Devuelve `null` si todo OK (el handler puede continuar),
 * o `NextResponse` con el error correspondiente.
 *
 * - 503 si `PORTAL_ADMIN_PASSWORD` no está set en server.
 * - 401 si el header está ausente, malformado, o las credenciales fallan.
 *   El navegador mostrará el prompt nativo "Sign in" gracias a
 *   `WWW-Authenticate: Basic realm=…`.
 */
export function requireAdminBasicAuth(req: NextRequest): NextResponse | null {
  const expectedPassword = process.env.PORTAL_ADMIN_PASSWORD;
  if (!expectedPassword) {
    return serviceUnavailableResponse(
      "Admin auth not configured.\n" +
        "Set PORTAL_ADMIN_PASSWORD env var in Vercel and redeploy.",
    );
  }

  const adminEmailsCsv = process.env.PORTAL_ADMIN_EMAILS ?? "";
  const adminEmails = adminEmailsCsv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  if (adminEmails.length === 0) {
    return serviceUnavailableResponse(
      "Admin allowlist empty.\n" +
        "Set PORTAL_ADMIN_EMAILS env var (CSV) in Vercel and redeploy.",
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("basic ")) {
    return unauthorizedResponse();
  }

  const encoded = authHeader.slice("basic ".length).trim();
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf-8");
  } catch {
    return unauthorizedResponse();
  }

  // Formato esperado: "email:password". Email puede contener ":" en teoría,
  // así que partimos por el PRIMER ":".
  const colonIdx = decoded.indexOf(":");
  if (colonIdx === -1) {
    return unauthorizedResponse();
  }
  const email = decoded.slice(0, colonIdx).trim().toLowerCase();
  const password = decoded.slice(colonIdx + 1);

  // El email debe estar en la allowlist (constante-time check sobre el match).
  const emailAuthorized = adminEmails.some((e) => safeEqual(email, e));
  if (!emailAuthorized) {
    return unauthorizedResponse();
  }

  if (!safeEqual(password, expectedPassword)) {
    return unauthorizedResponse();
  }

  return null;
}
