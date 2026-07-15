"use client";

import { MemberKpisEditor } from "./member-kpis-editor";
import { DeptExtrasEditor } from "./dept-extras-editor";
import { SubBlock } from "./sub-block";
import { RndToolsEditor } from "./rnd-tools-editor";
import { FieldTextarea } from "./member-fields";
import { EditableTable, type ColDef } from "../editable-table";
import type { DomingoSection, RmaCase } from "@/lib/reports/schema";

const RMA_COLUMNS: ColDef<RmaCase>[] = [
  {
    key: "caso",
    header: "Caso",
    type: "textarea",
    placeholder: "Descripción del caso",
    cellClassName: "min-w-[220px]",
  },
  {
    key: "estado",
    header: "Estado",
    type: "select",
    options: [
      { value: "abierto", label: "🟡 Abierto" },
      { value: "en_progreso", label: "🔵 En progreso" },
      { value: "esperando_proveedor", label: "🟠 Esperando proveedor" },
      { value: "escalada", label: "🔴 Escalada" },
      { value: "cerrada", label: "🟢 Cerrada" },
    ],
    cellClassName: "w-44",
  },
  {
    key: "sla",
    header: "SLA respuesta",
    type: "text",
    placeholder: "p. ej. 24h",
    cellClassName: "w-32",
  },
];

function newRmaCase(): RmaCase {
  return { id: crypto.randomUUID(), caso: "", estado: "abierto", sla: "" };
}

interface Props {
  value: DomingoSection;
  onChange: (v: DomingoSection) => void;
}

export function DomingoEditor({ value, onChange }: Props) {
  const patch = (p: Partial<DomingoSection>) => onChange({ ...value, ...p });
  const { kds } = value;

  return (
    <div className="space-y-4">
      <MemberKpisEditor
        value={value.kpisPersonales}
        onChange={(kpisPersonales) => patch({ kpisPersonales })}
      />

      <SubBlock title="🔬 P1 · Herramientas I+D">
        <RndToolsEditor value={value.toolsRnd} onChange={(toolsRnd) => patch({ toolsRnd })} />
      </SubBlock>

      <SubBlock title="🔧 P2 · RMA y Proveedores">
        <EditableTable<RmaCase>
          columns={RMA_COLUMNS}
          value={value.rma.casos}
          onChange={(casos) => patch({ rma: { casos } })}
          newRow={newRmaCase}
          addLabel="Añadir caso"
        />
      </SubBlock>

      <SubBlock title="🖥️ P3 · KDS">
        <FieldTextarea
          label="Nuevos clientes"
          value={kds.nuevosClientes}
          onChange={(v) => patch({ kds: { ...kds, nuevosClientes: v } })}
          placeholder="Altas de la semana…"
        />
        <FieldTextarea
          label="Cambios en el uso general"
          value={kds.cambiosUso}
          onChange={(v) => patch({ kds: { ...kds, cambiosUso: v } })}
          placeholder="Cambios observados en el uso general del KDS…"
        />
        <FieldTextarea
          label="Pendientes (esta semana → siguiente)"
          value={kds.pendientes}
          onChange={(v) => patch({ kds: { ...kds, pendientes: v } })}
          placeholder="Pendientes que pasan a la semana siguiente…"
        />
      </SubBlock>

      <DeptExtrasEditor
        highlights={value.highlights}
        blockers={value.blockers}
        onHighlightsChange={(highlights) => patch({ highlights })}
        onBlockersChange={(blockers) => patch({ blockers })}
      />
    </div>
  );
}
