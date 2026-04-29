import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit (db:push, db:migrate, db:generate) hace DDL → necesita el role
// `postgres` vía session pooler. Si no está, cae al runtime URL aunque vaya a fallar.
const ddlUrl = process.env.PORTAL_DATABASE_DDL_URL ?? process.env.PORTAL_DATABASE_URL;

if (!ddlUrl) {
  // eslint-disable-next-line no-console
  console.warn("[drizzle] PORTAL_DATABASE_DDL_URL no está definida — los comandos db:* fallarán.");
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["portal"],
  dbCredentials: {
    url: ddlUrl ?? "",
  },
  verbose: true,
  strict: true,
});
