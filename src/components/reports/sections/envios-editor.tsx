"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { Envios, EnviosOrderRow } from "@/lib/reports/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ORDER_COLUMNS: ColDef<EnviosOrderRow>[] = [
  {
    key: "venue",
    header: "Local / Venue",
    type: "text",
    placeholder: "Nombre del local",
    cellClassName: "min-w-[180px]",
  },
  {
    key: "status",
    header: "Estado",
    type: "select",
    options: [
      { value: "completado", label: "✅ Completado" },
      { value: "enviado", label: "📦 Enviado" },
      { value: "pendiente", label: "⏳ Pendiente" },
      { value: "bloqueado", label: "🚫 Bloqueado" },
    ],
    cellClassName: "w-36",
  },
  {
    key: "notes",
    header: "Notas",
    type: "text",
    placeholder: "Observaciones…",
    cellClassName: "min-w-[200px]",
  },
];

function newOrderRow(): EnviosOrderRow {
  return {
    id: crypto.randomUUID(),
    venue: "",
    status: "pendiente",
    notes: "",
  };
}

interface Props {
  value: Envios;
  onChange: (v: Envios) => void;
}

export function EnviosEditor({ value, onChange }: Props) {
  function patch(partial: Partial<Envios>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      {/* Métricas auto */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Métricas (auto-poblado desde MainOPS en publicación)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: "totalOps", label: "Total ops" },
              { key: "completed", label: "Completadas" },
              { key: "shipped", label: "Enviadas" },
              { key: "pending", label: "Pendientes" },
              { key: "grossRevenue", label: "Facturación bruta €" },
              { key: "avgDeliveryDays", label: "Días entrega prom." },
              { key: "sla7dPct", label: "SLA 7d %" },
            ] as Array<{ key: keyof Envios; label: string }>
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

      {/* Campos manuales */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Manual
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Margen €</Label>
            <Input
              type="number"
              value={value.marginEur ?? ""}
              placeholder="—"
              onChange={(e) =>
                patch({ marginEur: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cobertura PnP</Label>
            <Input
              type="text"
              value={value.coveragePnp}
              placeholder="Descripción…"
              onChange={(e) => patch({ coveragePnp: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Oficina vs Proveedor</Label>
            <Input
              type="text"
              value={value.officeVsProvider}
              placeholder="Descripción…"
              onChange={(e) => patch({ officeVsProvider: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pedidos destacados
        </p>
        <EditableTable<EnviosOrderRow>
          columns={ORDER_COLUMNS}
          value={value.orders}
          onChange={(orders) => patch({ orders })}
          newRow={newOrderRow}
          addLabel="Añadir pedido"
        />
      </div>
    </div>
  );
}
