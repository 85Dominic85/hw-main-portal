import "server-only";

/**
 * Hash y verificación de contraseñas con PBKDF2-SHA256 (Web Crypto).
 * Formato almacenado: `pbkdf2$<iteraciones>$<saltB64url>$<hashB64url>`.
 *
 * Se usa solo en contexto server (login y CRUD de usuarios). No usamos bcrypt
 * para no añadir dependencias nativas; PBKDF2 con 210k iteraciones es adecuado.
 */

const ITERATIONS = 210_000;
const KEY_LEN_BITS = 256;
const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function constTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function pbkdf2(plain: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(plain), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    KEY_LEN_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(plain, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1]!, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  let salt: Uint8Array;
  try {
    salt = fromB64url(parts[2]!);
  } catch {
    return false;
  }
  const hash = await pbkdf2(plain, salt, iterations);
  return constTimeEqual(b64url(hash), parts[3]!);
}
