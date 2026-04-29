import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { BypassBanner } from "@/components/layout/bypass-banner";
import { getCurrentUser } from "@/lib/auth/session";
import { AUTH_BYPASS_ENABLED } from "@/lib/auth/bypass";

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <BypassBanner />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav role={user.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            user={{ email: user.email, fullName: user.fullName, role: user.role }}
            bypass={AUTH_BYPASS_ENABLED}
          />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
