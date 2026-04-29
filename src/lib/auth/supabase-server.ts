import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Lee/escribe cookies vía la API de Next.js. Sprint 1 lo usará para
 * sesiones magic-link.
 *
 * Si las env vars no están definidas (Sprint 0), las llamadas fallarán
 * con error claro pero el dev server arranca sin tocar Supabase.
 */

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[supabase-server] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Configura .env.local antes de invocar Supabase.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Llamado desde un Server Component sin response — Next.js bloquea
          // cookies.set fuera de server actions / route handlers. Es esperado.
        }
      },
    },
  });
}
