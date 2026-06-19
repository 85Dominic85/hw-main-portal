"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { Configuraciones, ConfigTechBreakdownRow } from "@/lib/reports/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TECH_COLUMNS: ColDef<ConfigTechBreakdownRow>[] = [
  {
    key: "technician",
    header: "Técnico",
    type: "text",
    placeholder: "Nombre",
    cellClassName: "min-w-[120px]",
  },
  {
    key: "count",
    header: "Configs",
    type: "number",
    placeholder: "0",
    cellClassName: "w-20",
  },
  {
    key: "avgMinutes",
    header: "Min. promedio",
    type: "number",
    placeholder: "0",
    cellClassName: "w-28",
  },
  {
    key: "successRate",
    header: "% éxito",
    type: "number",
    placeholder: "0–100",
    cellClassName: "w-24",
  },
];

function newTechRow(): ConfigTechBreakdownRow {
  return {
    id: crypto.randomUUID(),
    technician: "",
    count: null,
    avgMinutes: null,
    successRate: null,
  };
}

interface Props {
  value: Configuraciones;
  onChange: (v: Configuraciones) => void;
}

export function ConfiguracionesEditor({ value, onChange }: Props) {
  function patch(partial: Partial<Configuraciones>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      {/* Métricas resumen (auto) */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Resumen (auto-poblado en publicación)
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Total configs</Label>
            <Input
              type="number"
              value={value.totalConfigs ?? ""}
              placeholder="—"
              onChange={(e) =>
                patch({ totalConfigs: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">% éxito 1ª</Label>
            <Input
              type="number"
              value={value.successRate1st ?? ""}
              placeholder="—"
              onChange={(e) =>
                patch({ successRate1st: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">% éxito 2ª</Label>
            <Input
              type="number"
              value={value.successRate2nd ?? ""}
              placeholder="—"
              onChange={(e) =>
                patch({ successRate2nd: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* Breakdown por técnico (manual) */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Breakdown por técnico
        </p>
        <EditableTable<ConfigTechBreakdownRow>
          columns={TECH_COLUMNS}
          value={value.techBreakdown}
          onChange={(techBreakdown) => patch({ techBreakdown })}
          newRow={newTechRow}
          addLabel="Añadir técnico"
        />
      </div>

      {/* Problemas */}
      <div className="space-y-1">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Problemas / Incidencias
        </Label>
        <Textarea
          value={value.problems}
          placeholder="Incidencias, anomalías o casos especiales…"
          rows={3}
          onChange={(e) => patch({ problems: e.target.value })}
        />
      </div>
    </div>
  );
}
