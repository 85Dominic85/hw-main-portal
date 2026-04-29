import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HsmPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HSM</h1>
        <p className="text-sm text-muted-foreground">
          Hardware Support Manager — incidencias y RMAs. Integración prevista para v2.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendiente para v2</CardTitle>
          <CardDescription>
            HSM se conectará envolviendo las queries existentes en
            <code className="mx-1 font-mono">src/server/queries/dashboard.ts</code> y{" "}
            <code className="font-mono">analytics.ts</code> en un endpoint
            <code className="mx-1 font-mono">/api/portal/metrics</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
