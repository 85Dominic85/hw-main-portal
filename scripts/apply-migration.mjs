#!/usr/bin/env node
/**
 * Aplica una migración SQL contra el PORTAL_DATABASE_URL definido en .env.local.
 *
 * Uso:
 *   node scripts/apply-migration.mjs sql/0001_init.sql
 *   node scripts/apply-migration.mjs sql/0001_init.sql --verify
 *
 * Requiere conectar como rol `postgres` (la direct connection string).
 * El rol runtime `portal_app` no tiene DDL — esto es por diseño.
 *
 * No imprime la URL de la BD ni la password en stdout / logs.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

// Las env vars se inyectan vía `node --env-file=.env.local` (Node 20+).

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Migraciones DDL → role postgres → PORTAL_DATABASE_DDL_URL.
// Si no está, cae al runtime URL pero probablemente fallará por permisos.
const url = process.env.PORTAL_DATABASE_DDL_URL ?? process.env.PORTAL_DATABASE_URL;
if (!url) {
  console.error("✖ Define PORTAL_DATABASE_DDL_URL (o PORTAL_DATABASE_URL) en .env.local.");
  process.exit(1);
}

const sqlFile = process.argv[2];
const verify = process.argv.includes("--verify");

if (!sqlFile) {
  console.error("✖ Indica el archivo SQL: node scripts/apply-migration.mjs sql/0001_init.sql");
  process.exit(1);
}

const sqlPath = resolve(projectRoot, sqlFile);
let sqlContent;
try {
  sqlContent = await readFile(sqlPath, "utf8");
} catch (err) {
  console.error(`✖ No se puede leer ${sqlPath}: ${err.message}`);
  process.exit(1);
}

console.log(`▶ Aplicando ${sqlFile} (${sqlContent.length.toLocaleString("es-ES")} bytes)…`);

// Direct connection (puerto 5432) — soporta DDL, multi-statement, transacciones.
// `prepare: false` no es necesario aquí (no es pooler), pero lo dejo por consistencia.
const sql = postgres(url, {
  ssl: "require",
  max: 1,
  prepare: false,
  onnotice: (n) => {
    // Filtra "NOTICE: extension already exists" y similares para output más limpio.
    if (!/already exists|skipping/i.test(n.message)) {
      console.log(`  · ${n.severity}: ${n.message}`);
    }
  },
});

try {
  await sql.unsafe(sqlContent);
  console.log("✔ Migración aplicada sin errores.");

  if (verify) {
    console.log("\n▶ Verificación post-migración…\n");

    const tables = await sql`
      select tablename, rowsecurity
      from pg_tables
      where schemaname = 'portal'
      order by tablename
    `;
    console.log(`Tablas en schema portal (${tables.length}):`);
    for (const t of tables) {
      console.log(`  · ${t.tablename}  ${t.rowsecurity ? "RLS✓" : "RLS✗"}`);
    }

    const policies = await sql`
      select schemaname, tablename, policyname
      from pg_policies
      where schemaname = 'portal'
      order by tablename, policyname
    `;
    console.log(`\nRLS policies (${policies.length}):`);
    for (const p of policies) {
      console.log(`  · ${p.tablename}.${p.policyname}`);
    }

    const triggers = await sql`
      select event_object_schema as schema, event_object_table as tbl, trigger_name
      from information_schema.triggers
      where event_object_schema in ('portal', 'auth')
        and trigger_name in ('set_updated_at', 'on_auth_user_created')
      order by schema, tbl, trigger_name
    `;
    console.log(`\nTriggers relevantes (${triggers.length}):`);
    for (const t of triggers) {
      console.log(`  · ${t.schema}.${t.tbl} → ${t.trigger_name}`);
    }

    const adminEmails = await sql`select email from portal.admin_emails order by email`;
    console.log(`\nAdmin emails seedeados (${adminEmails.length}):`);
    for (const a of adminEmails) {
      console.log(`  · ${a.email}`);
    }

    const portalAppRole = await sql`
      select rolname, rolcanlogin
      from pg_roles
      where rolname = 'portal_app'
    `;
    console.log(`\nRole portal_app: ${portalAppRole.length === 1 ? "✓ existe" : "✗ NO existe"}`);
  }
} catch (err) {
  console.error("\n✖ Error aplicando migración:");
  console.error(`  ${err.message}`);
  if (err.position) console.error(`  posición SQL: ${err.position}`);
  if (err.detail) console.error(`  detalle: ${err.detail}`);
  if (err.where) console.error(`  contexto: ${err.where}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
