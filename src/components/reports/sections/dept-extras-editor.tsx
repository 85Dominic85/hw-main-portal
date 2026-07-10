"use client";

import { TiptapEditor } from "../tiptap-editor";
import { BlockersEditor } from "./blockers-editor";
import type { Highlights, Blockers } from "@/lib/reports/schema";

interface Props {
  highlights: Highlights;
  blockers: Blockers;
  onHighlightsChange: (v: Highlights) => void;
  onBlockersChange: (v: Blockers) => void;
}

/**
 * Dos cajas comunes a cada área de departamento: highlights (texto rico) y
 * bloqueos (tabla), para que cada encargado aporte lo suyo dentro de su sección.
 */
export function DeptExtrasEditor({
  highlights,
  blockers,
  onHighlightsChange,
  onBlockersChange,
}: Props) {
  return (
    <>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Highlights del área
        </p>
        <TiptapEditor
          value={highlights.doc}
          onChange={(doc) => onHighlightsChange({ doc })}
          placeholder="Logros y avances del área…"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bloqueos del área
        </p>
        <BlockersEditor value={blockers} onChange={onBlockersChange} />
      </div>
    </>
  );
}
