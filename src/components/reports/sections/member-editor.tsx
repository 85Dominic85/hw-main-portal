"use client";

import { EditableTable, type ColDef } from "../editable-table";
import { DeptExtrasEditor } from "./dept-extras-editor";
import type { MemberSection, PersonalKpiRow } from "@/lib/reports/schema";

const KPI_COLUMNS: ColDef<PersonalKpiRow>[] = [
  {
    key: "label",
    header: "KPI",
    type: "text",
    placeholder: "Nombre del KPI",
    cellClassName: "min-w-[180px]",
  },
  {
    key: "value",
    header: "Valor",
    type: "text",
    placeholder: "—",
    cellClassName: "w-28",
  },
  {
    key: "target",
    header: "Target",
    type: "text",
    placeholder: "—",
    cellClassName: "w-28",
  },
  {
    key: "status",
    header: "Estado",
    type: "select",
    options: [
      { value: "verde", label: "🟢 Verde" },
      { value: "amarillo", label: "🟡 Ámbar" },
      { value: "rojo", label: "🔴 Rojo" },
      { value: "neutral", label: "— Neutral" },
    ],
    cellClassName: "w-32",
  },
];

function newKpiRow(): PersonalKpiRow {
  return { id: crypto.randomUUID(), label: "", value: "", target: "", status: "neutral" };
}

interface Props {
  value: MemberSection;
  onChange: (v: MemberSection) => void;
}

export function MemberEditor({ value, onChange }: Props) {
  function patch(partial: Partial<MemberSection>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          KPIs personales
        </p>
        <EditableTable<PersonalKpiRow>
          columns={KPI_COLUMNS}
          value={value.kpisPersonales}
          onChange={(kpisPersonales) => patch({ kpisPersonales })}
          newRow={newKpiRow}
          addLabel="Añadir KPI"
        />
      </div>

      <DeptExtrasEditor
        highlights={value.highlights}
        blockers={value.blockers}
        onHighlightsChange={(highlights) => patch({ highlights })}
        onBlockersChange={(blockers) => patch({ blockers })}
      />
    </div>
  );
}
