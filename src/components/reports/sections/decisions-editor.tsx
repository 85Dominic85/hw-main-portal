"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { Decisions, DecisionRow } from "@/lib/reports/schema";

const COLUMNS: ColDef<DecisionRow>[] = [
  {
    key: "status",
    header: "Estado",
    type: "select",
    options: [
      { value: "pendiente", label: "Pendiente" },
      { value: "cerrada", label: "Cerrada" },
      { value: "escalada", label: "Escalada" },
    ],
    cellClassName: "w-32",
  },
  {
    key: "description",
    header: "Decisión",
    type: "text",
    placeholder: "¿Qué hay que decidir?",
    cellClassName: "min-w-[220px]",
  },
  {
    key: "owner",
    header: "Owner",
    type: "text",
    placeholder: "Nombre",
    cellClassName: "w-28",
  },
  {
    key: "deadline",
    header: "Fecha límite",
    type: "text",
    placeholder: "AAAA-MM-DD",
    cellClassName: "w-28",
  },
  {
    key: "resolution",
    header: "Resolución",
    type: "text",
    placeholder: "¿Cómo se cerró?",
    cellClassName: "min-w-[180px]",
  },
];

function newRow(): DecisionRow {
  return {
    id: crypto.randomUUID(),
    description: "",
    owner: "",
    deadline: "",
    status: "pendiente",
    resolution: "",
  };
}

interface Props {
  value: Decisions;
  onChange: (v: Decisions) => void;
}

export function DecisionsEditor({ value, onChange }: Props) {
  return (
    <EditableTable<DecisionRow>
      columns={COLUMNS}
      value={value.rows}
      onChange={(rows) => onChange({ rows })}
      newRow={newRow}
      addLabel="Añadir decisión"
    />
  );
}
