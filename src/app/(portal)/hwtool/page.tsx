import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HwToolPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HW Tool</h1>
        <p className="text-sm text-muted-foreground">
          Detalle de configuraciones, tiempos y plug-n-play. Conectado en Sprint 4.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pestaña en construcción</CardTitle>
          <CardDescription>
            KPIs de HW Tool, tendencia de configuraciones, top clientes y desglose por tipo de
            instalación.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sprint 4 leerá directamente el schema <code className="font-mono">hw_staging</code> de
          HW Tool con cliente Supabase read-only.
        </CardContent>
      </Card>
    </div>
  );
}
