"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "../tiptap-editor";
import { StatusSelect } from "../status-select";
import type { Performance, MemberBlock, MemberKpiRow } from "@/lib/reports/schema";
import { cn } from "@/lib/utils/cn";

function newKpiRow(): MemberKpiRow {
  return {
    id: crypto.randomUUID(),
    label: "",
    value: "",
    target: "",
    status: "neutral",
  };
}

interface MemberCardProps {
  block: MemberBlock;
  onChange: (b: MemberBlock) => void;
}

function MemberCard({ block, onChange }: MemberCardProps) {
  const [open, setOpen] = useState(true);

  function patchKpi(id: string, patch: Partial<MemberKpiRow>) {
    onChange({
      ...block,
      kpis: block.kpis.map((k) => (k.id === id ? { ...k, ...patch } : k)),
    });
  }

  function addKpi() {
    onChange({ ...block, kpis: [...block.kpis, newKpiRow()] });
  }

  function deleteKpi(id: string) {
    onChange({ ...block, kpis: block.kpis.filter((k) => k.id !== id) });
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-semibold">{block.displayName}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="min-w-[160px] px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    KPI
                  </th>
                  <th className="w-28 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="w-28 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Target
                  </th>
                  <th className="w-20 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {block.kpis.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-xs text-muted-foreground">
                      Sin KPIs — añade uno.
                    </td>
                  </tr>
                )}
                {block.kpis.map((kpi, i) => (
                  <tr
                    key={kpi.id}
                    className={cn(
                      "border-b border-border/60 last:border-0 hover:bg-accent/20",
                      i % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={kpi.label}
                        placeholder="Metrica"
                        onChange={(e) => patchKpi(kpi.id, { label: e.target.value })}
                        className="w-full rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={kpi.value}
                        placeholder="—"
                        onChange={(e) => patchKpi(kpi.id, { value: e.target.value })}
                        className="w-full rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={kpi.target}
                        placeholder="—"
                        onChange={(e) => patchKpi(kpi.id, { target: e.target.value })}
                        className="w-full rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <StatusSelect
                        value={kpi.status}
                        onChange={(status) => patchKpi(kpi.id, { status })}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                        onClick={() => deleteKpi(kpi.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addKpi}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Añadir KPI
          </Button>

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Narrativa
            </p>
            <TiptapEditor
              value={block.narrative}
              onChange={(narrative) => onChange({ ...block, narrative })}
              placeholder={`Resumen de la semana de ${block.displayName}...`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  value: Performance;
  onChange: (v: Performance) => void;
}

export function PerformanceEditor({ value, onChange }: Props) {
  function updateMember(idx: number, block: MemberBlock) {
    const members = [...value.members];
    members[idx] = block;
    onChange({ members });
  }

  return (
    <div className="space-y-3">
      {value.members.map((block, idx) => (
        <MemberCard
          key={block.member}
          block={block}
          onChange={(b) => updateMember(idx, b)}
        />
      ))}
    </div>
  );
}
