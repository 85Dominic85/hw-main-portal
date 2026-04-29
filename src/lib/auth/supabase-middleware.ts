import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Cliente Supabase específico para middleware.
 *
 * El middleware corre antes de la respuesta y necesita un adapter de cookies
 * que opere sobre el `request` (lectura) y devuelva una `response` con las
 * cookies actualizadas (escritura). Es el patrón oficial de @supabase/ssr.
 *
 * Devuelve `{ supabase, response }` para que el middleware pueda consultar
 * la sesión y devolver la response (que ya tiene las cookies refrescadas).
 */

export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Sin Supabase, el middleware se salta el check de sesión.
    // No tirar excepciones aquí: middleware debe permitir que la app arranque
    // aunque .env.local no esté configurado.
    return { supabase: null, response };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return { supabase, response };
}
