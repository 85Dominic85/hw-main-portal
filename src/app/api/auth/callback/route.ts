import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

/**
 * GET /api/auth/callback
 *
 * Endpoint que Supabase llama cuando el usuario pulsa el magic link en su email.
 * Recibe `?code=...&next=...` (o `?error=...&error_description=...` si falla).
 *
 * Flujo:
 *   1. Lee `code` del query.
 *   2. Llama `exchangeCodeForSession(code)` → establece la sesión vía cookies.
 *   3. Redirect a `next` (o `/`).
 *
 * Si el código es inválido o el usuario no está en la allowlist (el trigger
 * SQL lo bloquea con `raise exception`), redirige a `/login?error=...`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description");

  // Sanitiza `next` para prevenir open redirects.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription)}`,
        origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Falta el código de autenticación")}`, origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const msg =
      error.message?.includes("not allowed") || error.message?.includes("@qamarero.com")
        ? "Solo se permiten correos @qamarero.com"
        : error.message;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, origin),
    );
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
