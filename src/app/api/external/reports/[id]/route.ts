import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { checkApiKey, NO_STORE_HEADERS } from "@/lib/auth/api-key";
import { db, schema } from "@/lib/db";
import { EXTERNAL_REPORT_STATUSES, toExternalReport } from "@/lib/reports/external";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const { reports } = schema;

/**
 * GET /api/external/reports/{id} — un informe completo: metadatos, `markdown`
 * (incluida Performance), `content` estructurado y `kpiSnapshot`.
 * Auth: cabecera `X-API-Key` = REPORTS_READ_API_KEY. Los archivados dan 404.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkApiKey(req, "REPORTS_READ_API_KEY");
  if (denied) return denied;

  const { id } = await params;
  const notFound = () =>
    Response.json({ error: "Informe no encontrado" }, { status: 404, headers: NO_STORE_HEADERS });
  if (!z.string().uuid().safeParse(id).success) return notFound();

  try {
    const rows = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), inArray(reports.status, [...EXTERNAL_REPORT_STATUSES])))
      .limit(1);

    const report = rows[0];
    if (!report) return notFound();

    console.info(`[external-api] reports.get id=${id} status=${report.status}`);
    return Response.json(toExternalReport(report), { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error("[external-api] reports.get failed", err);
    return Response.json({ error: "Error interno" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
