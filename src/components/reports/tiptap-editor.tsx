"use client";

import dynamic from "next/dynamic";
import type { TiptapDoc } from "@/lib/reports/schema";

// Importación lazy con SSR desactivado — TipTap usa APIs de browser
const TiptapEditorInner = dynamic(() => import("./tiptap-editor-inner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[120px] animate-pulse rounded-md bg-muted/30" />
  ),
});

interface TiptapEditorProps {
  value: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function TiptapEditor(props: TiptapEditorProps) {
  return <TiptapEditorInner {...props} />;
}
