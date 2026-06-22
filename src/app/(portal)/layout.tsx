import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth/session";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";
import { getGuestDashboardsEnabled } from "@/lib/settings/guest-access";

/**
 * Todas las rutas del portal son dinámicas: dependen de connectors externos
 * (HW Tool, MainOPS) o, cuando esté activa, de la sesión Supabase.
 * Forzamos `dynamic` para evitar que Next intente pre-renderizar y serialice
 * mal los `Date` de los mocks o las cookies de auth.
 */
export const dynamic = "force-dynamic";

/**
 * Layout autenticado del portal — sidebar + topbar + main.
 *
 * Defensa en profundidad: el middleware ya redirige a /login si no hay sesión,
 * pero validamos también aquí por si alguien llamara a un Server Action
 * desde una sesión expirada o con cookies manipuladas.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const guestDashboardsEnabled = await getGuestDashboardsEnabled();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav
        role={user.role}
        isGuest={user.isGuest}
        guestDashboardsEnabled={guestDashboardsEnabled}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={{
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isGuest: user.isGuest,
          }}
          openMode={AUTH_BYPASS_ENABLED}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
