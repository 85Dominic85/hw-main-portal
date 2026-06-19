"use client";

import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

interface AutosaveIndicatorProps {
  state: AutosaveState;
  lastSavedAt?: Date;
}

export function AutosaveIndicator({ state, lastSavedAt }: AutosaveIndicatorProps) {
  if (state === "idle") return null;

  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Guardando…
      </span>
    );
  }

  if (state === "saved") {
    const seconds = lastSavedAt
      ? Math.round((Date.now() - lastSavedAt.getTime()) / 1000)
      : 0;
    const label = seconds < 5 ? "ahora mismo" : `hace ${seconds}s`;
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-status-ok" />
        Guardado {label}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-status-danger">
      <AlertCircle className="h-3 w-3" />
      Error al guardar
    </span>
  );
}
