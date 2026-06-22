/**
 * Cookie de sesión firmada (HMAC) que transporta { email, role }.
 *
 * El login (server) la emite tras validar credenciales; el middleware (Edge)
 * solo verifica la firma (sin BD) para gatear rutas privadas; getCurrentUser
 * la lee para resolver el usuario. Compatible Edge + Node (Web Crypto).
 *
 * Secreto: PORTAL_SESSION_SECRET (aleatorio, >=32 bytes, dedicado). NUNCA se
 * reutiliza la contraseña de login como clave de firma — sería forjable por
 * quien la conozca y de baja entropía. Si falta el secreto, no se puede
 * emitir/verificar → fail-secure (nadie entra hasta configurarlo).
 */

export const SESSION_COOKIE = "portal_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8h

export type SessionRole = "admin" | "viewer";
export interface SessionPayload {
  email: string;
  role: SessionRole;
  /** token_version de la cuenta al emitir; invalida la cookie si la cuenta lo sube. */
  tv: number;
}

const encoder = new TextEncoder();

function secret(): string | null {
  return process.env.PORTAL_SESSION_SECRET ?? null;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToString(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

async function hmac(data: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return b64url(new Uint8Array(sig));
}

function constTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function signSession(payload: SessionPayload): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const body = b64url(encoder.encode(JSON.stringify(payload)));
  const sig = await hmac(body, key);
  return `${body}.${sig}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const key = secret();
  if (!key) return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;
  const expected = await hmac(body, key);
  if (!constTimeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(b64urlToString(body)) as unknown;
    if (parsed && typeof parsed === "object") {
      const p = parsed as Partial<SessionPayload>;
      if (typeof p.email === "string" && (p.role === "admin" || p.role === "viewer")) {
        return { email: p.email, role: p.role, tv: typeof p.tv === "number" ? p.tv : 0 };
      }
    }
    return null;
  } catch {
    return null;
  }
}
