"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { setGuestDashboardsEnabled } from "@/lib/settings/guest-access";
import type { Result } from "@/lib/connectors/types";

/**
 * Activa/desactiva la visibilidad de los dashboards de detalle para invitados.
 * Solo admin. Revalida el layout para refrescar el sidebar.
 */
export async function toggleGuestDashboards(
  enabled: boolean,
): Promise<Result<{ enabled: boolean }>> {
  await requireAdmin();
  try {
    await setGuestDashboardsEnabled(enabled);
    revalidatePath("/", "layout");
    return { ok: true, data: { enabled } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
