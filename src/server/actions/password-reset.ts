"use server";

import { requestResetSchema, resetPasswordSchema } from "@/lib/validators/auth";
import {
  getAccountByEmail,
  setAccountPassword,
  createAccount,
  normalizeEmail,
  isAllowlistedAdmin,
} from "@/lib/auth/accounts";
import { signResetToken, verifyResetToken } from "@/lib/auth/reset-token";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/password-reset-email";
import type { PortalAccount } from "@/lib/db/schema/accounts";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Solicita un enlace de restablecimiento.
 *
 * Anti-enumeración: SIEMPRE responde ok (salvo email malformado), exista o no
 * la cuenta, para no revelar qué emails están registrados.
 *
 * - Cuenta activa → token con su token_version actual.
 * - Email del allowlist sin fila → token con tv=0 (al resetear se crea la fila).
 * - Otro caso → no se envía nada (pero responde ok igualmente).
 *
 * Si el envío falla o Resend no está configurado, se loguea el enlace en el
 * servidor (Vercel logs) como fallback para no quedarse sin vía de recuperación.
 */
export async function requestPasswordReset(input: unknown): Promise<Result<true>> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Email inválido." };
  }
  const email = normalizeEmail(parsed.data.email);

  let account: PortalAccount | null = null;
  try {
    account = await getAccountByEmail(email);
  } catch {
    account = null; // error transitorio → tratamos como sin fila
  }

  // ¿A quién le emitimos token? Cuenta activa, o admin del allowlist sin fila.
  let tv: number | null = null;
  if (account) {
    if (account.active) tv = account.tokenVersion;
  } else if (isAllowlistedAdmin(email)) {
    tv = 0;
  }

  // Sin destinatario válido → responde ok sin enviar (anti-enumeración).
  if (tv === null) return { ok: true, data: true };

  const token = await signResetToken({ email, tv });
  if (!token) {
    // Falta PORTAL_SESSION_SECRET: no se puede firmar. Fail-secure pero visible.
    console.error("[password-reset] PORTAL_SESSION_SECRET no configurada; no se puede emitir token.");
    return { ok: true, data: true };
  }

  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const { subject, html, text } = passwordResetEmail(resetUrl);

  const result = await sendEmail({ to: email, subject, html, text });
  if (!result.ok) {
    // Fallback: dejamos el enlace en los logs del servidor.
    console.warn(
      `[password-reset] No se pudo enviar el email (${result.error}). ` +
        `Enlace de reset para ${email}: ${resetUrl}`,
    );
  }

  return { ok: true, data: true };
}

/**
 * Establece la nueva contraseña a partir del token del email.
 *
 * - Verifica firma + caducidad del token.
 * - Cuenta existente: exige token_version coincidente (un solo uso) y activa.
 * - Sin fila pero email del allowlist: crea la cuenta admin con la contraseña.
 */
export async function resetPasswordWithToken(input: unknown): Promise<Result<true>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { token, password } = parsed.data;

  const payload = await verifyResetToken(token);
  if (!payload) {
    return { ok: false, error: "El enlace no es válido o ha caducado. Solicita uno nuevo." };
  }
  const email = normalizeEmail(payload.email);

  let account: PortalAccount | null = null;
  try {
    account = await getAccountByEmail(email);
  } catch {
    return { ok: false, error: "Error al acceder a la cuenta. Inténtalo de nuevo." };
  }

  try {
    if (account) {
      if (!account.active) {
        return { ok: false, error: "Esta cuenta está desactivada. Contacta con un admin." };
      }
      if (payload.tv !== account.tokenVersion) {
        return { ok: false, error: "El enlace ya se ha usado o ha caducado. Solicita uno nuevo." };
      }
      await setAccountPassword(account.id, password);
      return { ok: true, data: true };
    }

    // Sin fila: solo los emails del allowlist pueden crear cuenta vía reset.
    if (!isAllowlistedAdmin(email)) {
      return { ok: false, error: "El enlace no es válido. Solicita uno nuevo." };
    }
    await createAccount({ email, name: null, password, role: "admin" });
    return { ok: true, data: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo actualizar la contraseña.",
    };
  }
}
