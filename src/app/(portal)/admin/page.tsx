import Link from "next/link";
import { Target, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestDashboardsToggle } from "@/components/admin/guest-dashboards-toggle";
import { getGuestDashboardsEnabled } from "@/lib/settings/guest-access";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const guestDashboardsEnabled = await getGuestDashboardsEnabled();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de umbrales, notas, metas mensuales y manual entries. Solo admins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visibilidad para invitados
          </CardTitle>
          <CardDescription>
            Controla si los visitantes sin credenciales pueden ver los dashboards de
            detalle (Logística, Configuraciones, HSM). Los informes son siempre privados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuestDashboardsToggle initialEnabled={guestDashboardsEnabled} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/kpi-targets">
          <Card className="cursor-pointer transition-colors hover:bg-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Targets de KPI
              </CardTitle>
              <CardDescription>
                Catálogo de KPIs del informe — targets, umbrales ámbar/rojo y fuente de datos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Activo
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Umbrales semáforo</CardTitle>
            <CardDescription>
              Define a partir de qué valor un KPI pasa a ámbar/rojo en el dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sprint 5</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notas sobre métricas</CardTitle>
            <CardDescription>Contexto cuando un KPI se desvía.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sprint 5</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manual entries</CardTitle>
            <CardDescription>
              Métricas manuales que no viven en ninguna herramienta.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sprint 5</CardContent>
        </Card>
      </div>
    </div>
  );
}
