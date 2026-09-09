"use client";

import * as React from "react";
import { Check, Copy, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface WeeklyExportButtonsProps {
  weekKey: string;
  hasEntries: boolean;
}

/**
 * Exports del recopilatorio.
 *
 * "Copiar para Notion" trae el markdown y lo deja en el portapapeles — igual
 * que el export de los informes, que no usa la API de Notion sino pegado
 * manual. El PDF se abre en una pestaña nueva.
 */
export function WeeklyExportButtons({ weekKey, hasEntries }: WeeklyExportButtonsProps) {
  const [copying, setCopying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function copyNotion() {
    if (copying) return;
    setCopying(true);
    try {
      const res = await fetch(`/api/portal/bitacora/${weekKey}/export/notion`);
      if (!res.ok) throw new Error(await res.text());
      await navigator.clipboard.writeText(await res.text());
      setCopied(true);
      toast.success("Markdown copiado — pégalo en Notion");
      window.setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? `No se pudo copiar: ${err.message}`
          : "No se pudo copiar el recopilatorio.",
      );
    } finally {
      setCopying(false);
    }
  }

  if (!hasEntries) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin entradas que exportar esta semana.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={copyNotion} disabled={copying} size="sm" className="gap-2">
        {copying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? "Copiado" : "Copiar para Notion"}
      </Button>

      <Button variant="outline" size="sm" asChild className="gap-2">
        <a
          href={`/api/portal/bitacora/${weekKey}/export/markdown`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
          Markdown
        </a>
      </Button>

      <Button variant="outline" size="sm" asChild className="gap-2">
        <a
          href={`/api/portal/bitacora/${weekKey}/export/pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
          PDF
        </a>
      </Button>
    </div>
  );
}
