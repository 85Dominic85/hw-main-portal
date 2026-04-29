import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth/session";

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
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={{ email: user.email, fullName: user.fullName, role: user.role }}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
