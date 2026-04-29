"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MainOpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[mainops] error boundary:", error.message, error.digest);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-status-danger/30">
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-danger/10 text-status-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>No se pudo cargar la pestaña MainOps</CardTitle>
            <CardDescription>
              Hubo un fallo en el servidor al renderizar las métricas.
              Reintenta o vuelve a la home.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Digest: <code className="font-mono">{error.digest}</code> — pásalo
              al equipo técnico para localizar el log en Vercel.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Volver a la home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
