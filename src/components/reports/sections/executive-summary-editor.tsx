"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExecutiveSummary, ExecutiveSummaryRow } from "@/lib/reports/schema";
import { cn } from "@/lib/utils/cn";
import { StatusSelect } from "../status-select";

interface Props {
  value: ExecutiveSummary;
  onChange: (v: ExecutiveSummary) => void;
}

function newRow(): ExecutiveSummaryRow {
  return {
    id: crypto.randomUUID(),
    kpiKey: crypto.randomUUID().slice(0, 8),
    label: "",
    unit: "",
    target: "",
    actual: "",
    delta: "",
    source: "manual",
    status: "neutral",
    owner: "",
    comment: "",
  };
}

function updateRow(
  rows: ExecutiveSummaryRow[],
  id: string,
  patch: Partial<ExecutiveSummaryRow>,
): ExecutiveSummaryRow[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

const inputCls =
  "w-full rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function ExecutiveSummaryEditor({ value, onChange }: Props) {
  const rows = value.rows;

  function handleChange(id: string, patch: Partial<ExecutiveSummaryRow>) {
    onChange({ rows: updateRow(rows, id, patch) });
  }

  function handleAdd() {
    onChange({ rows: [...rows, newRow()] });
  }

  function handleDelete(id: string) {
    onChange({ rows: rows.filter((r) => r.id !== id) });
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="min-w-[150px] px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">KPI</th>
              <th className="min-w-[110px] px-3 py-2 text-left text-xs font-medium text-muted-foreground">Target</th>
              <th className="min-w-[120px] px-3 py-2 text-left text-xs font-medium text-muted-foreground">Actual</th>
              <th className="min-w-[120px] px-3 py-2 text-left text-xs font-medium text-muted-foreground">Semana anterior</th>
              <th className="min-w-[110px] px-3 py-2 text-left text-xs font-medium text-muted-foreground">Owner</th>
              <th className="w-24 px-3 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
              <th className="min-w-[160px] px-3 py-2 text-left text-xs font-medium text-muted-foreground">Comentario</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin KPIs — pulsa &ldquo;Añadir KPI&rdquo; para empezar.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/60 last:border-0 transition-colors hover:bg-accent/20",
                  i % 2 === 1 && "bg-muted/20",
                )}
              >
                <td className="min-w-[150px] px-2 py-1">
                  <input
                    type="text"
                    value={row.label}
                    placeholder="Nombre del KPI"
                    onChange={(e) => handleChange(row.id, { label: e.target.value })}
                    className={inputCls}
                  />
                </td>
                <td className="min-w-[110px] px-2 py-1">
                  <input
                    type="text"
                    value={row.target}
                    placeholder="4.000 €"
                    onChange={(e) => handleChange(row.id, { target: e.target.value })}
                    className={inputCls}
                  />
                </td>
                <td className="min-w-[120px] px-2 py-1">
                  <input
                    type="text"
                    value={row.actual}
                    placeholder="33 registros"
                    onChange={(e) => handleChange(row.id, { actual: e.target.value })}
                    className={inputCls}
                  />
                </td>
                <td className="min-w-[120px] px-2 py-1">
                  <input
                    type="text"
                    value={row.delta}
                    placeholder="valor semana ant."
                    onChange={(e) => handleChange(row.id, { delta: e.target.value })}
                    className={inputCls}
                  />
                </td>
                <td className="min-w-[110px] px-2 py-1">
                  <input
                    type="text"
                    value={row.owner}
                    placeholder="Guille / Domi"
                    onChange={(e) => handleChange(row.id, { owner: e.target.value })}
                    className={inputCls}
                  />
                </td>
                <td className="w-24 px-2 py-1">
                  <StatusSelect
                    value={row.status}
                    onChange={(status) => handleChange(row.id, { status })}
                  />
                </td>
                <td className="min-w-[160px] px-2 py-1">
                  <input
                    type="text"
                    value={row.comment}
                    placeholder="Comentario opcional..."
                    onChange={(e) => handleChange(row.id, { comment: e.target.value })}
                    className={inputCls}
                  />
                </td>
                <td className="w-10 px-2 py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                    onClick={() => handleDelete(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Añadir KPI
      </Button>
    </div>
  );
}
