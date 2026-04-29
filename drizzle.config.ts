import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.PORTAL_DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("[drizzle] PORTAL_DATABASE_URL no está definida — comandos drizzle-kit fallarán hasta que la configures.");
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["portal"],
  dbCredentials: {
    url: process.env.PORTAL_DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
