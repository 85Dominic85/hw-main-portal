"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPasswordFromSession } from "@/server/actions/password-reset";

export function ResetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const result = await setPasswordFromSession({ password, confirm });
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    toast.success("Contraseña actualizada. Ya estás dentro.");
    // El reset deja la sesión iniciada → a la home.
    window.location.assign("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Estableciendo la contraseña de{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>

      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          aria-invalid={!!error}
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Repite la contraseña</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={submitting}
          aria-invalid={!!error}
          aria-describedby={error ? "reset-error" : undefined}
        />
      </div>

      {error && (
        <p id="reset-error" role="alert" className="text-sm text-status-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Guardando…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Guardar contraseña
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
