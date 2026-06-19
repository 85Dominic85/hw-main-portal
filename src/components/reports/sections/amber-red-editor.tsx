"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { AmberRed, AmberRedRow } from "@/lib/reports/schema";

const COLUMNS: ColDef<AmberRedRow>[] = [
  {
    key: "status",
    header: "Estado",
    type: "select",
    options: [
      { value: "amarillo", label: "🟡 Amarillo" },
      { value: "rojo", label: "🔴 Rojo" },
    ],
    cellClassName: "w-32",
  },
  {
    key: "kpi",
    header: "KPI / Área",
    type: "text",
    placeholder: "Ej. SLA 7d, Tasa éxito…",
    cellClassName: "min-w-[140px]",
  },
  {
    key: "rootCause",
    header: "Causa raíz",
    type: "text",
    placeholder: "¿Por qué?",
    cellClassName: "min-w-[180px]",
  },
  {
    key: "action",
    header: "Acción correctora",
    type: "text",
    placeholder: "¿Qué hacemos?",
    cellClassName: "min-w-[180px]",
  },
  {
    key: "eta",
    header: "ETA",
    type: "text",
    placeholder: "AAAA-MM-DD",
    cellClassName: "w-28",
  },
  {
    key: "escalation",
    header: "Escalado a",
    type: "text",
    placeholder: "Pablo / —",
    cellClassName: "w-28",
  },
];

function newRow(): AmberRedRow {
  return {
    id: crypto.randomUUID(),
    status: "amarillo",
    kpi: "",
    rootCause: "",
    action: "",
    eta: "",
    escalation: "",
  };
}

interface Props {
  value: AmberRed;
  onChange: (v: AmberRed) => void;
}

export function AmberRedEditor({ value, onChange }: Props) {
  return (
    <EditableTable<AmberRedRow>
      columns={COLUMNS}
      value={value.rows}
      onChange={(rows) => onChange({ rows })}
      newRow={newRow}
      addLabel="Añadir incidencia"
    />
  );
}
