"use client";

import { MemberKpisEditor } from "./member-kpis-editor";
import { DeptExtrasEditor } from "./dept-extras-editor";
import { SubBlock } from "./sub-block";
import { RndToolsEditor } from "./rnd-tools-editor";
import { FieldInput } from "./member-fields";
import { TiptapEditor } from "../tiptap-editor";
import type { MarcoSection } from "@/lib/reports/schema";

interface Props {
  value: MarcoSection;
  onChange: (v: MarcoSection) => void;
}

export function MarcoEditor({ value, onChange }: Props) {
  const patch = (p: Partial<MarcoSection>) => onChange({ ...value, ...p });
  const { cajones } = value;

  return (
    <div className="space-y-4">
      <MemberKpisEditor
        value={value.kpisPersonales}
        onChange={(kpisPersonales) => patch({ kpisPersonales })}
      />

      <SubBlock title="🔬 P1 · Herramientas I+D">
        <RndToolsEditor value={value.toolsRnd} onChange={(toolsRnd) => patch({ toolsRnd })} />
      </SubBlock>

      <SubBlock title="📦 P2 · Cajones">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FieldInput
            label="Clientes nuevos"
            value={cajones.clientesNuevos}
            onChange={(v) => patch({ cajones: { ...cajones, clientesNuevos: v } })}
          />
          <FieldInput
            label="Activados"
            value={cajones.activados}
            onChange={(v) => patch({ cajones: { ...cajones, activados: v } })}
          />
          <FieldInput
            label="Pendientes"
            value={cajones.pendientes}
            onChange={(v) => patch({ cajones: { ...cajones, pendientes: v } })}
          />
          <FieldInput
            label="MRR nuevo actual"
            value={cajones.mrrNuevo}
            onChange={(v) => patch({ cajones: { ...cajones, mrrNuevo: v } })}
          />
        </div>
      </SubBlock>

      <SubBlock title="⭐ P3 · Q Experience">
        <TiptapEditor
          value={value.qExperience.doc}
          onChange={(doc) => patch({ qExperience: { doc } })}
          placeholder="Datos y notas de Q Experience…"
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
