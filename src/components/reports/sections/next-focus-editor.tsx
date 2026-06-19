"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { NextFocus, NextFocusRow } from "@/lib/reports/schema";

const COLUMNS: ColDef<NextFocusRow>[] = [
  {
    key: "priority",
    header: "Prioridad",
    type: "select",
    options: [
      { value: "alta", label: "🔴 Alta" },
      { value: "media", label: "🟡 Media" },
      { value: "baja", label: "🟢 Baja" },
    ],
    cellClassName: "w-28",
  },
  {
    key: "owner",
    header: "Owner",
    type: "text",
    placeholder: "Nombre",
    cellClassName: "w-28",
  },
  {
    key: "objective",
    header: "Objetivo",
    type: "text",
    placeholder: "¿Qué queremos conseguir?",
    cellClassName: "min-w-[220px]",
  },
  {
    key: "output",
    header: "Output esperado",
    type: "text",
    placeholder: "¿Cómo sabremos que está hecho?",
    cellClassName: "min-w-[200px]",
  },
];

function newRow(): NextFocusRow {
  return {
    id: crypto.randomUUID(),
    owner: "",
    objective: "",
    output: "",
    priority: "media",
  };
}

interface Props {
  value: NextFocus;
  onChange: (v: NextFocus) => void;
}

export function NextFocusEditor({ value, onChange }: Props) {
  return (
    <EditableTable<NextFocusRow>
      columns={COLUMNS}
      value={value.rows}
      onChange={(rows) => onChange({ rows })}
      newRow={newRow}
      addLabel="Añadir objetivo"
    />
  );
}
