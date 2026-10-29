import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { checkApiKey, NO_STORE_HEADERS } from "@/lib/auth/api-key";
import { db, schema } from "@/lib/db";
import { EXTERNAL_REPORT_STATUSES, toExternalReportSummary } from "@/lib/reports/external";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const { reports } = schema;

const querySchema = z.object({
  status: z.enum(EXTERNAL_REPORT_STATUSES).optional(),
  type: z.enum(["weekly", "monthly", "custom"]).optional(),
});

/**
 * GET /api/external/reports — lista de informes (publicados y borradores).
 * Auth: cabecera `X-API-Key` = REPORTS_READ_API_KEY. Filtros opcionales
 * `?status=published|draft` y `?type=weekly|monthly|custom`.
 */
export async function GET(req: Request) {
  const denied = checkApiKey(req, "REPORTS_READ_API_KEY");
  if (denied) return denied;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Parámetros inválidos: status=published|draft, type=weekly|monthly|custom" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const { status, type } = parsed.data;

  try {
    const rows = await db
      .select({
        id: reports.id,
        type: reports.type,
        periodKey: reports.periodKey,
        isoYear: reports.isoYear,
        isoWeek: reports.isoWeek,
        title: reports.title,
        status: reports.status,
        globalStatus: reports.globalStatus,
        publishedAt: reports.publishedAt,
        updatedAt: reports.updatedAt,
      })
      .from(reports)
      .where(
        and(
          status ? eq(reports.status, status) : inArray(reports.status, [...EXTERNAL_REPORT_STATUSES]),
          type ? eq(reports.type, type) : undefined,
        ),
      )
      .orderBy(desc(reports.createdAt))
      .limit(500);

    console.info(`[external-api] reports.list status=${status ?? "all"} type=${type ?? "all"} count=${rows.length}`);
    return Response.json(
      { reports: rows.map(toExternalReportSummary) },
      { headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    console.error("[external-api] reports.list failed", err);
    return Response.json({ error: "Error interno" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
