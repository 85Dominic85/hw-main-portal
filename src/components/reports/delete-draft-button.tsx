"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteDraftReport } from "@/server/actions/reports";

interface DeleteDraftButtonProps {
  reportId: string;
  /** Si se pasa, navega aquí tras borrar (p. ej. "/reports"). Si no, refresca. */
  redirectTo?: string;
  /** Texto junto al icono (modo botón). Si se omite, solo icono. */
  label?: string;
}

export function DeleteDraftButton({ reportId, redirectTo, label }: DeleteDraftButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDelete(e: React.MouseEvent) {
    stop(e);
    startTransition(async () => {
      const res = await deleteDraftReport({ reportId });
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success("Borrador eliminado.");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1" onClick={stop}>
        <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">¿Eliminar?</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? "Eliminando…" : "Sí, eliminar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={(e) => {
            stop(e);
            setConfirming(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={label ? "sm" : "icon"}
      className="text-muted-foreground hover:text-destructive"
      title="Eliminar borrador"
      onClick={(e) => {
        stop(e);
        setConfirming(true);
      }}
    >
      <Trash2 className="h-4 w-4" />
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );
}
