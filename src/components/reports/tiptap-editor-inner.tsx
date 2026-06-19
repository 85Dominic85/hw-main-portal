"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Undo,
  Redo,
  Heading2,
  Heading3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TiptapDoc } from "@/lib/reports/schema";

interface TiptapEditorInnerProps {
  value: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function TiptapEditorInner({
  value,
  onChange,
  placeholder = "Escribe aquí…",
  className,
  readOnly = false,
}: TiptapEditorInnerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange(editor.getJSON() as TiptapDoc);
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background",
        !readOnly && "focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="H2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="H3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Negrita"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Cursiva"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Lista"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Lista numerada"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => {
              const prev = editor.getAttributes("link").href ?? "";
              const url = window.prompt("URL del enlace:", prev);
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().unsetLink().run();
              } else {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            active={editor.isActive("link")}
            title="Enlace"
          >
            <Link2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Deshacer"
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Rehacer"
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none px-4 py-3 outline-none",
          "[&_.ProseMirror]:outline-none",
          readOnly && "px-0 py-0",
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border" />;
}
