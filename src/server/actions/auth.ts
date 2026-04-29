"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { signInSchema } from "@/lib/validators/auth";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Server Action: envía un magic link al email del usuario.
 *
 * Defensa en profundidad:
 *   - Validación Zod (formato + dominio @qamarero.com).
 *   - El trigger SQL `handle_new_auth_user` rechaza emails fuera del dominio.
 *   - Supabase rate-limita reenvíos del mismo email.
 *
 * El callback del magic link es `/api/auth/callback?next=...&code=...`.
 */
export async function signInWithMagicLink(
  raw: unknown,
): Promise<Result<{ email: string }>> {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors;
    const message =
      firstError.email?.[0] ?? firstError.next?.[0] ?? "Datos inválidos";
    return { ok: false, error: message };
  }

  const { email, next } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const callbackUrl = new URL("/api/auth/callback", appUrl);
  if (next && next !== "/") callbackUrl.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      // shouldCreateUser=true por defecto. El trigger SQL valida el dominio
      // y crea la fila en portal.portal_users con su rol.
    },
  });

  if (error) {
    return {
      ok: false,
      error:
        error.status === 429
          ? "Has solicitado demasiados enlaces. Espera un minuto."
          : error.message,
    };
  }

  return { ok: true, data: { email } };
}

/**
 * Server Action: cierra sesión y redirige a /login.
 * Llamada desde el botón "Cerrar sesión" del topbar.
 */
export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
