import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "./session";
import { getGuestDashboardsEnabled } from "@/lib/settings/guest-access";

/**
 * Gate para los dashboards de detalle (/mainops, /hwtool, /hsm).
 *
 * - Los admins (3 cuentas del departamento) siempre pasan.
 * - Los invitados solo pasan si el toggle "guest dashboards" está activado.
 *   Si no, se les redirige a la home (solo ven los hero shields).
 */
export async function requireDashboardAccess(): Promise<void> {
  const user = await getCurrentUser();
  // Usuarios autenticados (admin o viewer) siempre pasan.
  if (!user.isGuest) return;
  // Invitados anónimos: solo si el toggle está activo.
  if (await getGuestDashboardsEnabled()) return;
  redirect("/");
}
