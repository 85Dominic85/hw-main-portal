"use client";

import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RndTools, RndTool } from "@/lib/reports/schema";

/**
 * P1 · Herramientas I+D (común). Lista de herramientas de las que el miembro es
 * owner, con lo que se ha hecho sobre cada una (actualizaciones, mejoras…).
 */
export function RndToolsEditor({
  value,
  onChange,
}: {
  value: RndTools;
  onChange: (v: RndTools) => void;
}) {
  const items = value.items;
  const update = (next: RndTool[]) => onChange({ items: next });
  const add = () => update([...items, { id: crypto.randomUUID(), tool: "", detail: "" }]);
  const patch = (id: string, partial: Partial<RndTool>) =>
    update(items.map((it) => (it.id === id ? { ...it, ...partial } : it)));
  const remove = (id: string) => update(items.filter((it) => it.id !== id));

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sin herramientas — añade las que tengas en propiedad.
        </p>
      )}
      {items.map((it) => (
        <div key={it.id} className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={it.tool}
              placeholder="Herramienta (p. ej. MainOPS, HW Tool…)"
              onChange={(e) => patch(it.id, { tool: e.target.value })}
              className="flex-1 rounded-sm border-0 bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-none text-muted-foreground/50 hover:text-destructive"
              onClick={() => remove(it.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <textarea
            value={it.detail}
            rows={2}
            placeholder="Actualizaciones, mejoras, añadidos…"
            onChange={(e) => patch(it.id, { detail: e.target.value })}
            className="w-full resize-y rounded-sm border border-border/60 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Añadir herramienta
      </Button>
    </div>
  );
}
