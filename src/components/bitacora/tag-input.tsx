"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  MAX_TAGS_PER_ENTRY,
  SUGGESTED_TAGS,
  normalizeTag,
  tagLabel,
} from "@/lib/bitacora/tags";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Entrada de etiquetas con chips.
 *
 * Las etiquetas son OPCIONALES: se puede guardar una entrada sin ninguna.
 * El catálogo sugerido se ofrece como chips de un clic para que las que más
 * se repiten queden consistentes (y la agregación del recopilatorio funcione),
 * pero se acepta cualquier etiqueta escrita a mano.
 *
 * Enter o coma confirman la etiqueta en curso; Backspace con el campo vacío
 * borra la última, como en los inputs de etiquetas que la gente ya conoce.
 */
export function TagInput({ value, onChange, disabled, className }: TagInputProps) {
  const [draft, setDraft] = React.useState("");
  const atLimit = value.length >= MAX_TAGS_PER_ENTRY;

  const add = React.useCallback(
    (raw: string) => {
      const tag = normalizeTag(raw);
      if (!tag || value.includes(tag) || value.length >= MAX_TAGS_PER_ENTRY) return;
      onChange([...value, tag]);
    },
    [value, onChange],
  );

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      // Enter aquí NO debe enviar el formulario: confirma la etiqueta.
      e.preventDefault();
      add(draft);
      setDraft("");
      return;
    }
    if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      remove(value[value.length - 1]!);
    }
  }

  const available = SUGGESTED_TAGS.filter((t) => !value.includes(t));

  return (
    <div className={cn("space-y-2", className)}>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Etiquetas de la entrada">
          {value.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 py-0.5 pl-2.5 pr-1 font-mono text-[11px] text-foreground">
                {tagLabel(tag)}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  disabled={disabled}
                  aria-label={`Quitar etiqueta ${tagLabel(tag)}`}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) {
            add(draft);
            setDraft("");
          }
        }}
        disabled={disabled || atLimit}
        placeholder={
          atLimit
            ? `Máximo ${MAX_TAGS_PER_ENTRY} etiquetas`
            : "Etiquetas (opcional) — Enter para añadir"
        }
        aria-label="Añadir etiqueta"
      />

      {available.length > 0 && !atLimit && (
        <div className="flex flex-wrap gap-1">
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              disabled={disabled}
              className="rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-solid hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              + {tagLabel(tag)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
