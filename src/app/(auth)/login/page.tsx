import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Login del portal — Sprint 0 placeholder.
 *
 * Sprint 1 implementará: form con email + magic link via Supabase Auth,
 * allowlist `@qamarero.com`, redirect tras callback.
 *
 * De momento sólo enseña el shell para verificar layout/tema.
 */

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-mono text-xl tracking-tight">
            Qamarero / HW
          </CardTitle>
          <CardDescription>HW Main Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Magic link disponible en Sprint 1. De momento, accede a la home en
            local con el botón de abajo.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Entrar (placeholder)</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
