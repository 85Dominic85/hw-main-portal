"use client";

import { MemberKpisEditor } from "./member-kpis-editor";
import { DeptExtrasEditor } from "./dept-extras-editor";
import { SubBlock } from "./sub-block";
import { RndToolsEditor } from "./rnd-tools-editor";
import { FieldTextarea } from "./member-fields";
import type { GuillermoSection } from "@/lib/reports/schema";

interface Props {
  value: GuillermoSection;
  onChange: (v: GuillermoSection) => void;
}

export function GuillermoEditor({ value, onChange }: Props) {
  const patch = (p: Partial<GuillermoSection>) => onChange({ ...value, ...p });
  const { contabilidad, amExperience } = value;

  return (
    <div className="space-y-4">
      <MemberKpisEditor
        value={value.kpisPersonales}
        onChange={(kpisPersonales) => patch({ kpisPersonales })}
      />

      <SubBlock title="🔬 P1 · Herramientas I+D">
        <RndToolsEditor value={value.toolsRnd} onChange={(toolsRnd) => patch({ toolsRnd })} />
      </SubBlock>

      <SubBlock title="💶 P2 · Contabilidad">
        <FieldTextarea
          label="Vencimientos"
          value={contabilidad.vencimientos}
          onChange={(v) => patch({ contabilidad: { ...contabilidad, vencimientos: v } })}
          placeholder="Vencimientos próximos, pagos comprometidos…"
        />
        <FieldTextarea
          label="Facturas"
          value={contabilidad.facturas}
          onChange={(v) => patch({ contabilidad: { ...contabilidad, facturas: v } })}
          placeholder="Facturas emitidas / recibidas, cobros…"
        />
        <FieldTextarea
          label="Reinversión"
          value={contabilidad.reinversion}
          onChange={(v) => patch({ contabilidad: { ...contabilidad, reinversion: v } })}
          placeholder="Reinversión del periodo…"
        />
      </SubBlock>

      <SubBlock title="🎧 P3 · AM Experience">
        <FieldTextarea
          label="Incidencias"
          value={amExperience.incidencias}
          onChange={(v) => patch({ amExperience: { ...amExperience, incidencias: v } })}
          placeholder="Incidencias del periodo…"
        />
        <FieldTextarea
          label="Mejoras"
          value={amExperience.mejoras}
          onChange={(v) => patch({ amExperience: { ...amExperience, mejoras: v } })}
          placeholder="Mejoras aplicadas o propuestas…"
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
