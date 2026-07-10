"use client";

import { TiptapEditor } from "../tiptap-editor";
import { DeptExtrasEditor } from "./dept-extras-editor";
import type { MarcoInforme } from "@/lib/reports/schema";

interface Props {
  value: MarcoInforme;
  onChange: (v: MarcoInforme) => void;
}

export function MarcoEditor({ value, onChange }: Props) {
  function patch(partial: Partial<MarcoInforme>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      <DeptExtrasEditor
        highlights={value.highlights}
        blockers={value.blockers}
        onHighlightsChange={(highlights) => patch({ highlights })}
        onBlockersChange={(blockers) => patch({ blockers })}
      />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Narrativa / Informe
        </p>
        <TiptapEditor
          value={value.narrative}
          onChange={(narrative) => patch({ narrative })}
          placeholder="Informe de Marco: contexto, avances, análisis…"
        />
      </div>
    </div>
  );
}
