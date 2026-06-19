"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createReport } from "@/server/actions/reports";
import { formatWeekKey } from "@/lib/reports/iso-week";

interface NewReportWizardProps {
  defaultIsoYear: number;
  defaultIsoWeek: number;
}

type ReportType = "weekly" | "monthly" | "custom";

export function NewReportWizard({ defaultIsoYear, defaultIsoWeek }: NewReportWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ReportType>("weekly");

  // Weekly state
  const [isoYear, setIsoYear] = useState(defaultIsoYear);
  const [isoWeek, setIsoWeek] = useState(defaultIsoWeek);

  // Monthly state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Custom state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      let input: unknown;
      if (type === "weekly") {
        input = { type: "weekly", isoYear, isoWeek };
      } else if (type === "monthly") {
        input = { type: "monthly", year, month };
      } else {
        if (!from || !to) {
          toast.error("Indica las fechas de inicio y fin.");
          return;
        }
        input = { type: "custom", from, to };
      }

      const result = await createReport(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Borrador creado.");
      router.push(`/reports/${result.data.id}/edit`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipo de informe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de tipo */}
        <div className="grid grid-cols-3 gap-3">
          {(["weekly", "monthly", "custom"] as ReportType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80 hover:bg-accent/40"
              }`}
            >
              {t === "weekly" ? "Semanal" : t === "monthly" ? "Mensual" : "Personalizado"}
            </button>
          ))}
        </div>

        {/* Selector de periodo según tipo */}
        {type === "weekly" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semana ISO</Label>
              <Input
                type="number"
                min={1}
                max={53}
                value={isoWeek}
                onChange={(e) => setIsoWeek(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input
                type="number"
                min={2025}
                max={2100}
                value={isoYear}
                onChange={(e) => setIsoYear(Number(e.target.value))}
              />
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">
              Period key: <span className="font-mono">{formatWeekKey(isoYear, isoWeek)}</span>
            </div>
          </div>
        )}

        {type === "monthly" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input
                type="number"
                min={2025}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {type === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={isPending} className="w-full">
          {isPending ? "Creando..." : "Crear borrador"}
        </Button>
      </CardContent>
    </Card>
  );
}
