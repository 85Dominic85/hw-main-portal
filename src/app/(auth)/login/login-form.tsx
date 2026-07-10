"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/server/actions/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");
  const resetDone = searchParams.get("reset") === "1";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(errorParam);

  React.useEffect(() => {
    if (resetDone) toast.success("Contraseña actualizada. Inicia sesión con la nueva.");
  }, [resetDone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await login({ email, password });
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    toast.success("Sesión iniciada");
    // Navegación dura para que el middleware re-evalúe la cookie en la ruta destino.
    // Solo paths internos: rechaza protocol-relative (//host) y /\host.
    const isInternal = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
    window.location.assign(isInternal ? next : "/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            tabIndex={submitting ? -1 : 0}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          aria-invalid={!!error}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      {error && (
        <p id="login-error" role="alert" className="text-sm text-status-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Entrando…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrar
          </>
        )}
      </Button>
    </form>
  );
}
