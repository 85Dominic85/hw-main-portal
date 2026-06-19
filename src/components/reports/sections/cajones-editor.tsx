"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { Cajones, CajonRow } from "@/lib/reports/schema";

const COLUMNS: ColDef<CajonRow>[] = [
  {
    key: "client",
    header: "Cliente",
    type: "text",
    placeholder: "Nombre del local",
    cellClassName: "min-w-[160px]",
  },
  {
    key: "status",
    header: "Estado",
    type: "text",
    placeholder: "Instalado / Pendiente…",
    cellClassName: "w-36",
  },
  {
    key: "provider",
    header: "Proveedor",
    type: "text",
    placeholder: "Proveedor cajon",
    cellClassName: "w-36",
  },
  {
    key: "notes",
    header: "Notas",
    type: "text",
    placeholder: "Observaciones…",
    cellClassName: "min-w-[200px]",
  },
  {
    key: "mrr",
    header: "MRR €",
    type: "number",
    placeholder: "0",
    cellClassName: "w-24",
  },
];

function newRow(): CajonRow {
  return {
    id: crypto.randomUUID(),
    client: "",
    status: "",
    provider: "",
    notes: "",
    mrr: null,
  };
}

interface Props {
  value: Cajones;
  onChange: (v: Cajones) => void;
}

export function CajonesEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <EditableTable<CajonRow>
        columns={COLUMNS}
        value={value.rows}
        onChange={(rows) => onChange({ rows })}
        newRow={newRow}
        addLabel="Añadir cajon"
      />
      {value.rows.length > 0 && (
        <p className="text-right text-sm text-muted-foreground">
          MRR total:{" "}
          <span className="font-semibold text-foreground">
            {value.rows
              .reduce((sum, r) => sum + (r.mrr ?? 0), 0)
              .toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </span>
        </p>
      )}
    </div>
  );
}
