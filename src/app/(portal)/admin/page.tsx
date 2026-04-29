import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de umbrales, notas, metas mensuales y manual entries. Solo admins.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Umbrales semáforo</CardTitle>
            <CardDescription>
              Define a partir de qué valor un KPI pasa a ámbar/rojo.
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
            <CardTitle>Metas mensuales</CardTitle>
            <CardDescription>Objetivos del dpto comparados con realidad.</CardDescription>
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
