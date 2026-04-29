import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MainOpsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">MainOPS</h1>
        <p className="text-sm text-muted-foreground">
          Detalle de pedidos, ingresos y envíos. Conectado en Sprint 3.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pestaña en construcción</CardTitle>
          <CardDescription>
            Aquí irán los KPIs detallados de MainOPS, los filtros temporales (D/S/Q/M/custom),
            las gráficas de tendencia y el listado de pedidos en tránsito.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sprint 3 conectará el endpoint <code className="font-mono">GET /api/metrics</code> de MainOPS
          y poblará esta vista con datos reales.
        </CardContent>
      </Card>
    </div>
  );
}
