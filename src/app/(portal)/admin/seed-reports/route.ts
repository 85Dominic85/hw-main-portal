import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { buildExampleReports } from "@/lib/reports/seed/build-seed";

export const dynamic = "force-dynamic";

const { reports } = schema;

/**
 * Endpoint admin para sembrar los informes de ejemplo (W20/W21/W22) desde el
 * propio servidor (que ya tiene PORTAL_DATABASE_URL). Útil cuando no se dispone
 * de credenciales de BD en local.
 *
 * Protegido por el middleware Basic Auth de `/admin/*`. Requiere `?go=1` para
 * ejecutar (evita disparos accidentales). Idempotente: borra el informe del
 * mismo period_key antes de insertar.
 *
 *   GET /admin/seed-reports?go=1
 */
export async function GET(req: NextRequest) {
  const go = new URL(req.url).searchParams.get("go") === "1";
  if (!go) {
    return NextResponse.json({
      info: "Sembrado de informes de ejemplo. Visita /admin/seed-reports?go=1 para ejecutar (W20/W21/W22).",
    });
  }

  try {
    const rows = buildExampleReports();
    const seeded: string[] = [];

    for (const r of rows) {
      await db
        .delete(reports)
        .where(and(eq(reports.type, "weekly"), eq(reports.periodKey, r.periodKey)));

      await db.insert(reports).values({
        type: "weekly",
        periodKey: r.periodKey,
        periodFrom: r.periodFrom,
        periodTo: r.periodTo,
        isoYear: r.isoYear,
        isoWeek: r.isoWeek,
        status: "published",
        globalStatus: r.globalStatus,
        title: r.title,
        content: r.content as unknown as Record<string, unknown>,
        publishedAt: r.publishedAt,
        createdBy: null,
        publishedBy: null,
      });

      seeded.push(`${r.periodKey} — ${r.title}`);
    }

    return NextResponse.json({ ok: true, seeded: seeded.length, reports: seeded });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
