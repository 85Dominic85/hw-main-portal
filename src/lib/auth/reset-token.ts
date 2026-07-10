import "server-only";

/**
 * Token de restablecimiento de contraseña — HMAC stateless (sin tabla en BD).
 *
 * Reutiliza PORTAL_SESSION_SECRET pero con SEPARACIÓN DE DOMINIO: el MAC se
 * calcula sobre `"pwreset."+body`, así una cookie de sesión (`hmac(body)`) no
 * puede usarse como token de reset ni viceversa.
 *
 * Payload `{ email, tv, exp }`:
 *   - `tv`  = token_version de la cuenta al emitir. Como `setAccountPassword`
 *             sube token_version, en cuanto se usa el enlace queda invalidado
 *             (un solo uso) y también caducan otros enlaces pendientes.
 *   - `exp` = epoch ms de caducidad (30 min).
 *
 * Sin secreto → null (fail-secure): nadie puede emitir/verificar tokens.
 */

const RESET_TTL_MS = 30 * 60 * 1000; // 30 min
const DOMAIN = "pwreset.";

export interface ResetPayload {
  email: string;
  tv: number;
  exp: number;
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

/** Firma un token de reset. `exp` se calcula aquí (now + TTL). */
export async function signResetToken(
  input: { email: string; tv: number },
): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const payload: ResetPayload = {
    email: input.email,
    tv: input.tv,
    exp: Date.now() + RESET_TTL_MS,
  };
  const body = b64url(encoder.encode(JSON.stringify(payload)));
  const sig = await hmac(DOMAIN + body, key);
  return `${body}.${sig}`;
}

/** Verifica firma + caducidad. Devuelve el payload o null. */
export async function verifyResetToken(
  token: string | undefined | null,
): Promise<ResetPayload | null> {
  if (!token) return null;
  const key = secret();
  if (!key) return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;
  const expected = await hmac(DOMAIN + body, key);
  if (!constTimeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(b64urlToString(body)) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Partial<ResetPayload>;
    if (
      typeof p.email !== "string" ||
      typeof p.tv !== "number" ||
      typeof p.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() > p.exp) return null; // caducado
    return { email: p.email, tv: p.tv, exp: p.exp };
  } catch {
    return null;
  }
}
