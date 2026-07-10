"use server";

import { cookies } from "next/headers";

import { requestResetSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import {
  getAccountByEmail,
  setAccountPassword,
  createAccount,
  normalizeEmail,
  isAllowlistedAdmin,
} from "@/lib/auth/accounts";
import {
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type SessionRole,
} from "@/lib/auth/session-cookie";
import type { PortalAccount } from "@/lib/db/schema/accounts";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
}

/**
 * Solicita un enlace de recuperación. Usa el MAGIC LINK de Supabase como canal
 * de email y prueba de propiedad del correo — NO se añade proveedor externo.
 *
 * El enlace apunta a /api/auth/callback?next=/reset-password: al pulsarlo,
 * Supabase crea una sesión y aterriza en /reset-password, donde el usuario fija
 * su nueva contraseña (que se guarda en portal_accounts, el sistema real).
 *
 * Anti-enumeración: responde ok exista o no la cuenta (salvo rate-limit, que sí
 * se comunica porque es útil y no revela existencia).
 *
 * Requiere que las Redirect URLs de Supabase incluyan el callback (dashboard).
 */
export async function requestPasswordReset(input: unknown): Promise<Result<true>> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Email inválido." };
  }
  const email = normalizeEmail(parsed.data.email);

  try {
    const supabase = await createSupabaseServerClient();
    const redirect = new URL("/api/auth/callback", appUrl());
    redirect.searchParams.set("next", "/reset-password");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirect.toString(),
        // Crea el usuario de Supabase Auth si no existe (el trigger SQL valida
        // el dominio @qamarero.com). Necesario para admins que nunca han usado
        // magic link y solo viven en portal_accounts.
        shouldCreateUser: true,
      },
    });

    if (error) {
      if (error.status === 429) {
        return { ok: false, error: "Has solicitado demasiados enlaces. Espera un minuto." };
      }
      // Otros errores (config, dominio) → log servidor; anti-enumeración al UI.
      console.warn(`[password-reset] signInWithOtp (${email}): ${error.message}`);
    }
  } catch (err) {
    console.error("[password-reset] Supabase no disponible:", err);
  }

  return { ok: true, data: true };
}

/**
 * Fija la nueva contraseña. La identidad se toma de la SESIÓN de Supabase
 * establecida por el magic link (getUser). Escribe en portal_accounts y deja
 * al usuario logueado en el portal (cookie propia).
 *
 * - Cuenta existente y activa → cambia la contraseña.
 * - Sin fila pero email del allowlist → crea la cuenta admin.
 * - @qamarero.com sin fila y no-allowlist → se rechaza (no self-registro; un
 *   admin debe crear la cuenta viewer primero).
 */
export async function setPasswordFromSession(input: unknown): Promise<Result<true>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { password } = parsed.data;

  // 1. Email verificado desde la sesión Supabase (prueba del magic link).
  let email: string;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) {
      return {
        ok: false,
        error: "Tu enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.",
      };
    }
    email = normalizeEmail(data.user.email);
  } catch {
    return { ok: false, error: "No se pudo validar la sesión. Inténtalo de nuevo." };
  }

  // 2. Escribe la contraseña en portal_accounts.
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
      await setAccountPassword(account.id, password);
    } else if (isAllowlistedAdmin(email)) {
      await createAccount({ email, name: null, password, role: "admin" });
    } else {
      return {
        ok: false,
        error: "No tienes una cuenta en el portal. Pide a un admin que te cree una.",
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo actualizar la contraseña.",
    };
  }

  // 3. Auto-login en el portal (cookie propia) con el estado fresco.
  try {
    const fresh = await getAccountByEmail(email);
    const role: SessionRole = fresh?.role === "admin" ? "admin" : "viewer";
    const tv = fresh?.tokenVersion ?? 0;
    const token = await signSession({ email, role, tv });
    if (token) {
      const jar = await cookies();
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
    // Cierra la sesión Supabase: ya cumplió su función (prueba de email).
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    // La contraseña ya está cambiada; si el auto-login falla, entra manualmente.
    console.warn("[password-reset] auto-login tras reset falló:", err);
  }

  return { ok: true, data: true };
}
