"use client";

import { TiptapEditor } from "../tiptap-editor";
import type { IdStatus } from "@/lib/reports/schema";

interface Props {
  value: IdStatus;
  onChange: (v: IdStatus) => void;
}

export function IdStatusEditor({ value, onChange }: Props) {
  return (
    <TiptapEditor
      value={value.doc}
      onChange={(doc) => onChange({ doc })}
      placeholder="Estado del trabajo en curso de I+D…"
    />
  );
}
