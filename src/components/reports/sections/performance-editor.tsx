"use client";

import { TiptapEditor } from "../tiptap-editor";
import type { Performance, MemberBlock } from "@/lib/reports/schema";

interface Props {
  value: Performance;
  onChange: (v: Performance) => void;
}

export function PerformanceEditor({ value, onChange }: Props) {
  function updateMember(idx: number, block: MemberBlock) {
    onChange({ members: value.members.map((m, i) => (i === idx ? block : m)) });
  }

  return (
    <div className="space-y-4">
      {value.members.map((m, idx) => (
        <div key={m.member} className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold">{m.displayName}</p>
          <TiptapEditor
            value={m.narrative}
            onChange={(narrative) => updateMember(idx, { ...m, narrative })}
            placeholder={`Evaluación de ${m.displayName}…`}
          />
        </div>
      ))}
    </div>
  );
}
