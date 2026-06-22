import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

const { kpiThresholds } = schema;

/**
 * Flag: ¿pueden los invitados (no admin) ver los dashboards de detalle
 * (/mainops, /hwtool, /hsm)? Por defecto NO (solo la home).
 *
 * Se persiste como una fila reservada en `kpi_thresholds` (no requiere
 * migración nueva): kpi_id = clave reservada, warn_value = 1 (on) / 0 (off).
 * Encapsulado aquí para poder migrar a una tabla `app_settings` propia sin
 * tocar los callers.
 */
const SETTING_KEY = "system:guest_dashboards_enabled";

export async function getGuestDashboardsEnabled(): Promise<boolean> {
  try {
    const [row] = await db
      .select({ value: kpiThresholds.warnValue })
      .from(kpiThresholds)
      .where(eq(kpiThresholds.kpiId, SETTING_KEY))
      .limit(1);
    // numeric() se deserializa como string en drizzle.
    return Number(row?.value) === 1;
  } catch {
    // Ante cualquier fallo, lo seguro es NO exponer los dashboards.
    return false;
  }
}

export async function setGuestDashboardsEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? "1" : "0";
  await db
    .insert(kpiThresholds)
    .values({ kpiId: SETTING_KEY, warnValue: value })
    .onConflictDoUpdate({
      target: kpiThresholds.kpiId,
      set: { warnValue: value, updatedAt: new Date() },
    });
}
