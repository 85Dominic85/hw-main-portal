"use client";

import { useEffect, useState } from "react";
import { Braces, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RawJsonDialogProps {
  /** Título del modal (ej. nombre del conector). */
  title: string;
  /** Objeto a mostrar (respuesta mapeada o error). Debe ser serializable. */
  data: unknown;
}

/**
 * Botón "Ver JSON" + modal que muestra el objeto crudo formateado.
 * Modal artesanal (overlay fixed) siguiendo el patrón de refresh-sources-dialog.
 */
export function RawJsonDialog({ title, data }: RawJsonDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const json = safeStringify(data);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Braces className="h-3.5 w-3.5" />
        Ver JSON
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`JSON crudo — ${title}`}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{title} · respuesta cruda</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-auto p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                {json}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
