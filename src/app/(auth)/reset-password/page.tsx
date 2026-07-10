import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "./reset-password-form";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-mono text-xl tracking-tight">Qamarero / HW</CardTitle>
        <CardDescription>Elige una nueva contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-status-danger">
              Falta el token de restablecimiento. Abre el enlace desde el email que has recibido, o
              solicita uno nuevo.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Solicitar un enlace nuevo</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
