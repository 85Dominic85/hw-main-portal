"use client";

import { EditableTable, type ColDef } from "../editable-table";
import type { Blockers, BlockerRow } from "@/lib/reports/schema";

const COLUMNS: ColDef<BlockerRow>[] = [
  {
    key: "description",
    header: "Bloqueo",
    type: "text",
    placeholder: "Descripción del bloqueo…",
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
    key: "impact",
    header: "Impacto",
    type: "text",
    placeholder: "¿Qué se bloquea?",
    cellClassName: "min-w-[180px]",
  },
  {
    key: "status",
    header: "Estado",
    type: "select",
    options: [
      { value: "abierto", label: "Abierto" },
      { value: "en_progreso", label: "En progreso" },
      { value: "bloqueado", label: "Bloqueado" },
    ],
    cellClassName: "w-36",
  },
];

function newRow(): BlockerRow {
  return {
    id: crypto.randomUUID(),
    description: "",
    owner: "",
    impact: "",
    status: "abierto",
  };
}

interface Props {
  value: Blockers;
  onChange: (v: Blockers) => void;
}

export function BlockersEditor({ value, onChange }: Props) {
  return (
    <EditableTable<BlockerRow>
      columns={COLUMNS}
      value={value.rows}
      onChange={(rows) => onChange({ rows })}
      newRow={newRow}
      addLabel="Añadir bloqueo"
    />
  );
}
