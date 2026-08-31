"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { unpublishReport } from "@/server/actions/reports";

interface UnpublishButtonProps {
  reportId: string;
  /** Si true (default), tras despublicar navega al editor para corregir. */
  editAfter?: boolean;
}

/**
 * Devuelve un informe publicado a estado borrador (admin). Corrige el caso de
 * publicar con un dato mal: despublicar → editar → volver a publicar. Mientras
 * está en borrador deja de ser visible para los viewers, por eso pide confirmación.
 */
export function UnpublishButton({ reportId, editAfter = true }: UnpublishButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnpublish() {
    startTransition(async () => {
      const res = await unpublishReport({ reportId });
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success("Informe devuelto a borrador.");
      if (editAfter) router.push(`/reports/${reportId}/edit`);
      else router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
          Dejará de verse hasta republicar.
        </span>
        <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleUnpublish}>
          {isPending ? "Devolviendo…" : "Sí, a borrador"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      title="Devolver a borrador para corregir"
      onClick={() => setConfirming(true)}
    >
      <Undo2 className="mr-2 h-4 w-4" />
      Volver a borrador
    </Button>
  );
}
