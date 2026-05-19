import type { NextRequest } from "next/server";

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

const REALM = "HW Main Portal Admin";

/**
 * Devolvemos `Response` nativo (no `NextResponse`) porque algunos hosts
 * (Vercel edge runtime) filtran `WWW-Authenticate` cuando viene en un
 * `NextResponse`. El `Response` nativo lo pasa intacto y dispara el prompt
 * nativo del navegador.
 */
function unauthorizedResponse(message?: string): Response {
  const headers = new Headers();
  headers.set("WWW-Authenticate", `Basic realm="${REALM}"`);
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(message ?? "Authentication required", {
    status: 401,
    headers,
  });
}

function serviceUnavailableResponse(message: string): Response {
  const headers = new Headers();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(message, { status: 503, headers });
}

/**
 * Compara dos strings en tiempo constante (Edge-compatible).
 *
 * No usamos `node:crypto.timingSafeEqual` porque Next.js corre el
 * middleware en Edge Runtime por defecto y `node:crypto` no está
 * disponible — silently falla y devuelve 401 con creds correctas.
 *
 * Implementación: XOR char-by-char acumulando en un int. Si todos
 * coinciden, `result === 0`. Tiempo proporcional a la longitud, no
 * a las diferencias.
 */
function safeEqual(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < provided.length; i++) {
    result |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Decodifica un string base64 a UTF-8. Edge-compatible (usa `atob` global).
 * Devuelve null si el input es inválido.
 */
function decodeBase64Utf8(encoded: string): string | null {
  try {
    // atob produce un binary string; lo convertimos a bytes y luego a UTF-8.
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Valida un header `Authorization: Basic …` contra la allowlist +
 * password. Pura — no devuelve Response, solo el resultado.
 *
 * Devuelve `{ email }` si las credenciales son válidas (email autorizado
 * + password correcta). Devuelve `null` si falta, está malformado, o
 * cualquier credencial no coincide. Si las env vars no están configuradas
 * devuelve `{ misconfigured: true }` para que el caller pueda diferenciar.
 *
 * Lo usa tanto el middleware (para devolver 401) como el server component
 * que pinta el avatar (para identificar al usuario en el menú).
 */
export type BasicAuthResult =
  | { ok: true; email: string }
  | { ok: false; misconfigured: boolean };

export function validateBasicAuth(
  authHeader: string | null | undefined,
): BasicAuthResult {
  const expectedPassword = process.env.PORTAL_ADMIN_PASSWORD;
  const adminEmailsCsv = process.env.PORTAL_ADMIN_EMAILS ?? "";
  const adminEmails = adminEmailsCsv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  if (!expectedPassword || adminEmails.length === 0) {
    return { ok: false, misconfigured: true };
  }

  if (!authHeader || !authHeader.toLowerCase().startsWith("basic ")) {
    return { ok: false, misconfigured: false };
  }

  const encoded = authHeader.slice("basic ".length).trim();
  const decoded = decodeBase64Utf8(encoded);
  if (decoded === null) return { ok: false, misconfigured: false };

  // Formato esperado: "email:password". Email puede contener ":" en teoría,
  // así que partimos por el PRIMER ":".
  const colonIdx = decoded.indexOf(":");
  if (colonIdx === -1) return { ok: false, misconfigured: false };
  const email = decoded.slice(0, colonIdx).trim().toLowerCase();
  const password = decoded.slice(colonIdx + 1);

  const emailAuthorized = adminEmails.some((e) => safeEqual(email, e));
  if (!emailAuthorized) return { ok: false, misconfigured: false };

  if (!safeEqual(password, expectedPassword)) {
    return { ok: false, misconfigured: false };
  }

  return { ok: true, email };
}

/**
 * Verifica las credenciales Basic Auth contra la allowlist + password
 * compartida. Devuelve `null` si todo OK (el handler puede continuar),
 * o `Response` con el error correspondiente.
 *
 * - 503 si `PORTAL_ADMIN_PASSWORD` / `PORTAL_ADMIN_EMAILS` no están set.
 * - 401 si el header está ausente, malformado, o las credenciales fallan.
 *   El navegador mostrará el prompt nativo "Sign in" gracias a
 *   `WWW-Authenticate: Basic realm=…`.
 */
export function requireAdminBasicAuth(req: NextRequest): Response | null {
  const authHeader = req.headers.get("authorization");
  const result = validateBasicAuth(authHeader);
  if (result.ok) return null;
  if (result.misconfigured) {
    return serviceUnavailableResponse(
      "Admin auth not configured.\n" +
        "Set PORTAL_ADMIN_PASSWORD and PORTAL_ADMIN_EMAILS env vars in Vercel and redeploy.",
    );
  }
  return unauthorizedResponse();
}
