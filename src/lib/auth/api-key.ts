import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Auth por API key para las rutas `/api/external/*` (lectura por agentes y
 * automatizaciones). Misma convención que MainOps y HSM: cabecera `X-API-Key`
 * comparada en tiempo constante con una env var.
 *
 * Módulo sin `server-only` para poder testearlo; solo lo importan route handlers.
 */

/** Las respuestas de la API externa nunca se cachean (contienen datos internos). */
export const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

/** Longitud mínima de la clave configurada (`openssl rand -hex 32` da 64). */
export const MIN_API_KEY_LENGTH = 32;

/**
 * Compara la clave recibida con la esperada. Se comparan sus SHA-256 para que
 * `timingSafeEqual` reciba buffers de igual longitud y no se filtre la longitud.
 */
export function isValidApiKey(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Valida la cabecera `X-API-Key` contra `process.env[envName]`.
 * Devuelve `null` si pasa, o la respuesta de error a devolver tal cual:
 *   - 503 si la env var falta o es más corta que MIN_API_KEY_LENGTH
 *     (la API queda cerrada hasta que se configure)
 *   - 401 si falta la cabecera
 *   - 403 si no coincide
 */
export function checkApiKey(req: Request, envName: string): Response | null {
  const expected = process.env[envName];
  if (!expected || expected.length < MIN_API_KEY_LENGTH) {
    return Response.json(
      { error: `${envName} no configurada (mín. ${MIN_API_KEY_LENGTH} caracteres)` },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const provided = req.headers.get("x-api-key");
  if (!provided) {
    return Response.json(
      { error: "Missing X-API-Key header" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  if (!isValidApiKey(provided, expected)) {
    return Response.json(
      { error: "Invalid API key" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  return null;
}
