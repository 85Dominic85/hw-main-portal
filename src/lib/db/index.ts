import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Cliente Drizzle del schema `portal` del propio portal.
 *
 * Conexión via Supavisor pooler en transaction mode.
 * `prepare: false` es obligatorio en pooler.
 *
 * Sprint 0: si no hay PORTAL_DATABASE_URL, falla en el primer query
 * con un mensaje claro. Para que el dev server arranque, este módulo
 * solo se importa desde server-only paths.
 */

const connectionString = process.env.PORTAL_DATABASE_URL;

const client = connectionString
  ? postgres(connectionString, {
      prepare: false,
      max: 1,
      connect_timeout: 10,
    })
  : null;

export const db = client
  ? drizzle(client, { schema })
  : new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
      get() {
        throw new Error(
          "[db] PORTAL_DATABASE_URL no está configurada. Crea el proyecto Supabase del portal y rellena .env.local.",
        );
      },
    });

export { schema };
