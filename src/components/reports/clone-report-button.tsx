"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cloneReport } from "@/server/actions/reports";

interface Props {
  reportId: string;
  nextIsoYear: number;
  nextIsoWeek: number;
  nextPeriodLabel: string;
}

export function CloneReportButton({
  reportId,
  nextIsoYear,
  nextIsoWeek,
  nextPeriodLabel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  async function handleClone() {
    startTransition(async () => {
      const result = await cloneReport({
        sourceReportId: reportId,
        isoYear: nextIsoYear,
        isoWeek: nextIsoWeek,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setDone(true);
      toast.success(`Informe ${nextPeriodLabel} creado como borrador`);
      router.push(`/reports/${result.data.id}/edit`);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClone}
      disabled={isPending || done}
    >
      <Copy className="mr-2 h-4 w-4" />
      {isPending ? "Clonando…" : `Clonar → ${nextPeriodLabel}`}
    </Button>
  );
}
