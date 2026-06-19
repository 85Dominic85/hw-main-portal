"use client";

import { EditableTable, type ColDef } from "../editable-table";
import { TiptapEditor } from "../tiptap-editor";
import type { Soporte, RmaRow } from "@/lib/reports/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const RMA_COLUMNS: ColDef<RmaRow>[] = [
  {
    key: "provider",
    header: "Proveedor",
    type: "text",
    placeholder: "Fabricante / proveedor",
    cellClassName: "min-w-[140px]",
  },
  {
    key: "device",
    header: "Dispositivo",
    type: "text",
    placeholder: "Modelo o referencia",
    cellClassName: "min-w-[160px]",
  },
  {
    key: "status",
    header: "Estado",
    type: "text",
    placeholder: "En tránsito / Recibido…",
    cellClassName: "w-36",
  },
  {
    key: "daysOpen",
    header: "Días abierto",
    type: "number",
    placeholder: "0",
    cellClassName: "w-24",
  },
  {
    key: "notes",
    header: "Notas",
    type: "text",
    placeholder: "Observaciones…",
    cellClassName: "min-w-[180px]",
  },
];

function newRmaRow(): RmaRow {
  return {
    id: crypto.randomUUID(),
    provider: "",
    device: "",
    status: "",
    daysOpen: null,
    notes: "",
  };
}

interface Props {
  value: Soporte;
  onChange: (v: Soporte) => void;
}

export function SoporteEditor({ value, onChange }: Props) {
  function patch(partial: Partial<Soporte>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      {/* Métricas auto */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Métricas (auto-poblado desde HSM en publicación)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              { key: "openIncidents", label: "Incidencias abiertas" },
              { key: "activeRmas", label: "RMAs activos" },
              { key: "sla7dPct", label: "SLA 7d %" },
              { key: "sla30dPct", label: "SLA 30d %" },
              { key: "reopenRatePct", label: "Tasa reapertura %" },
              { key: "avgResolutionHours", label: "Resolución media h" },
            ] as Array<{ key: keyof Soporte; label: string }>
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                value={(value[key] as number | null) ?? ""}
                placeholder="—"
                onChange={(e) =>
                  patch({ [key]: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Manual: RMA <2h */}
      <div className="space-y-1">
        <Label className="text-xs">% RMA respondido en &lt;2h (manual hasta v2)</Label>
        <Input
          type="number"
          value={value.rmaResponseUnder2hPct ?? ""}
          placeholder="—"
          className="max-w-[160px]"
          onChange={(e) =>
            patch({ rmaResponseUnder2hPct: e.target.value === "" ? null : Number(e.target.value) })
          }
        />
      </div>

      {/* Tabla RMAs */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          RMAs activos
        </p>
        <EditableTable<RmaRow>
          columns={RMA_COLUMNS}
          value={value.rmas}
          onChange={(rmas) => patch({ rmas })}
          newRow={newRmaRow}
          addLabel="Añadir RMA"
        />
      </div>

      {/* Narrativa libre */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Narrativa / Análisis
        </p>
        <TiptapEditor
          value={value.narrative}
          onChange={(narrative) => patch({ narrative })}
          placeholder="Contexto, análisis de incidencias, tendencias…"
        />
      </div>
    </div>
  );
}
