"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithMagicLink } from "@/server/actions/auth";

const ALLOWLIST_DOMAIN =
  process.env.NEXT_PUBLIC_PORTAL_EMAIL_ALLOWLIST_DOMAIN ?? "qamarero.com";

type Status = "idle" | "submitting" | "sent";

export function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const next = searchParams.get("next") ?? undefined;

  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(errorParam);

  // Si vienes de una redirección con ?error=..., limpia tras 8s para no
  // taparlo con futuros mensajes.
  React.useEffect(() => {
    if (!errorParam) return;
    const t = setTimeout(() => setError(null), 8_000);
    return () => clearTimeout(t);
  }, [errorParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const result = await signInWithMagicLink({ email, next });

    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setStatus("sent");
    toast.success("Enlace enviado", {
      description: `Revisa la bandeja de ${result.data.email}.`,
    });
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-ok/10 text-status-ok">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Enlace enviado</h2>
          <p className="text-sm text-muted-foreground">
            Hemos enviado un enlace de acceso a <strong>{email}</strong>.
            <br />
            Ábrelo desde el mismo dispositivo para entrar.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
        >
          Usar otro email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email corporativo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          placeholder={`tu.nombre@${ALLOWLIST_DOMAIN}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          aria-invalid={!!error}
          aria-describedby={error ? "login-error" : undefined}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          Solo correos <code className="font-mono">@{ALLOWLIST_DOMAIN}</code>.
        </p>
      </div>

      {error && (
        <p id="login-error" role="alert" className="text-sm text-status-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Enviar enlace de acceso
          </>
        )}
      </Button>
    </form>
  );
}
