"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/actions/password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await requestPasswordReset({ email });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-status-ok" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Si existe una cuenta con <span className="font-medium text-foreground">{email}</span>, te
          hemos enviado un enlace de acceso a tu correo. Ábrelo (el más reciente) y podrás elegir tu
          nueva contraseña.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio de sesión
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Introduce tu email y te enviaremos un enlace para elegir una nueva contraseña.
      </p>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoFocus
          required
          placeholder="tu.nombre@qamarero.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          aria-invalid={!!error}
          aria-describedby={error ? "forgot-error" : undefined}
        />
      </div>

      {error && (
        <p id="forgot-error" role="alert" className="text-sm text-status-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Enviar enlace
          </>
        )}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
