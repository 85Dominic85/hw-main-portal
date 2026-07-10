import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // La identidad viene de la sesión de Supabase que estableció el magic link.
  let email: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) email = data.user.email;
  } catch {
    email = null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-mono text-xl tracking-tight">Qamarero / HW</CardTitle>
        <CardDescription>Elige una nueva contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        {email ? (
          <ResetPasswordForm email={email} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-status-danger">
              Este enlace de recuperación no es válido o ha caducado. Abre el enlace más reciente de
              tu correo, o solicita uno nuevo.
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
