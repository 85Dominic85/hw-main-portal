/**
 * Cookie de sesión admin firmada (HMAC).
 *
 * El Basic Auth solo se reenvía por el navegador a las rutas que devuelven 401
 * (p. ej. /admin, /reports). En el resto de páginas (dashboards) el header no
 * llega, así que no podríamos reconocer al admin allí. Para resolverlo, el
 * middleware setea esta cookie firmada cuando valida un Basic Auth correcto, y
 * `getCurrentUser` la lee en cualquier página.
 *
 * Compatible con Edge (middleware) y Node (server components): usa Web Crypto
 * (`crypto.subtle`), `btoa`/`atob` y `TextEncoder`, disponibles en ambos.
 * El secreto de firma es `PORTAL_ADMIN_PASSWORD` (server-only).
 */

export const ADMIN_COOKIE = "portal_admin";

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64url(new Uint8Array(sig));
}

function constTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/** Firma un token `<payload>.<sig>` con el email del admin. null si no hay secreto. */
export async function signAdminToken(email: string): Promise<string | null> {
  const secret = process.env.PORTAL_ADMIN_PASSWORD;
  if (!secret) return null;
  const payload = b64url(encoder.encode(email));
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

/** Verifica el token y devuelve el email si es válido; null en caso contrario. */
export async function verifyAdminToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const secret = process.env.PORTAL_ADMIN_PASSWORD;
  if (!secret) return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return null;
  const expected = await hmac(payload, secret);
  if (!constTimeEqual(sig, expected)) return null;
  try {
    return new TextDecoder().decode(b64urlDecode(payload));
  } catch {
    return null;
  }
}
