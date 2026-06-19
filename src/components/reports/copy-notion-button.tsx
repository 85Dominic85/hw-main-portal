"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  reportId: string;
}

export function CopyNotionButton({ reportId }: Props) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/reports/${reportId}/export/notion`);
      if (!res.ok) throw new Error("Error al obtener el contenido");
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado al portapapeles — pega en Notion con Cmd/Ctrl+V");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("No se pudo copiar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} disabled={loading || copied}>
      {copied ? (
        <Check className="mr-2 h-4 w-4 text-green-600" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {copied ? "Copiado" : "Copiar Notion"}
    </Button>
  );
}
