import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { db, schema } from "@/lib/db";
import { getWeekEntries } from "@/server/queries/bitacora";
import { summarizeWeek, type WeeklySummary } from "@/lib/bitacora/weekly-summary";
import { parseWeekKey } from "@/lib/reports/iso-week";

/**
 * Preámbulo común de los exports del recopilatorio: auth, rol, validación de
 * la semana y cálculo del resumen. Mismo patrón que las routes de export de
 * informes (401 sin sesión, 403 sin rol admin, 404 si la clave no cuadra).
 */
export async function loadWeekForExport(
  weekKey: string,
): Promise<
  | { ok: true; summary: WeeklySummary; userId: string }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (user.isGuest) {
    return { ok: false, response: new NextResponse("Unauthorized", { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { ok: false, response: new NextResponse("Forbidden", { status: 403 }) };
  }

  const parsed = parseWeekKey(weekKey);
  if (!parsed) {
    return {
      ok: false,
      response: new NextResponse("Semana no válida", { status: 404 }),
    };
  }

  const entries = await getWeekEntries(parsed.isoYear, parsed.isoWeek);
  return {
    ok: true,
    summary: summarizeWeek(entries, parsed.isoYear, parsed.isoWeek),
    userId: user.id,
  };
}

/**
 * Registra el export en `portal.export_log`. Best-effort: nunca debe romper la
 * respuesta. En modo bypass el usuario sintético no existe en `portal_users`
 * (FK export_log_user_id_fkey NOT NULL), así que se omite — igual que en las
 * routes de export de informes.
 */
export async function logExport(
  userId: string,
  kind: string,
  weekKey: string,
  rowCount: number,
): Promise<void> {
  if (AUTH_BYPASS_ENABLED) return;
  try {
    await db.insert(schema.exportLog).values({
      userId,
      exportKind: kind,
      filters: { week_key: weekKey },
      rowCount,
    });
  } catch (e) {
    console.error(`[export/${kind}] export_log insert failed`, e);
  }
}
