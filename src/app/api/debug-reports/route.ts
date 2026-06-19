import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Env vars (presencia, no valores)
  results.env = {
    hasPortalDbUrl: !!process.env.PORTAL_DATABASE_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    authRequired: process.env.PORTAL_AUTH_REQUIRED ?? "(no configurado)",
    portalDbUrlPrefix: process.env.PORTAL_DATABASE_URL?.slice(0, 30) ?? "(no set)",
  };

  // 2. Importar @/lib/db
  try {
    const { db, schema } = await import("@/lib/db");
    results.dbImport = "OK";
    results.schemaKeys = Object.keys(schema);

    // 3. Ejecutar listReports
    try {
      const { desc, ne } = await import("drizzle-orm");
      const { reports } = schema;
      const rows = await db
        .select({ id: reports.id, status: reports.status })
        .from(reports)
        .where(ne(reports.status, "archived"))
        .orderBy(desc(reports.createdAt))
        .limit(5);
      results.listReports = `OK — ${rows.length} filas`;
    } catch (e) {
      results.listReports = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  } catch (e) {
    results.dbImport = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. getCurrentUser
  try {
    const { getCurrentUser } = await import("@/lib/auth/session");
    const user = await getCurrentUser();
    results.getCurrentUser = user ? `OK — ${user.role} (${user.email})` : "null";
  } catch (e) {
    results.getCurrentUser = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(results, { status: 200 });
}
