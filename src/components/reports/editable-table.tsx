"use client";

import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ColDef<TRow> {
  key: keyof TRow & string;
  header: string;
  /** text = input text | number = input number | select = <select> | readonly = plain text */
  type: "text" | "number" | "select" | "readonly" | "textarea";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  cellClassName?: string;
}

interface EditableTableProps<TRow extends { id: string }> {
  columns: ColDef<TRow>[];
  value: TRow[];
  onChange: (rows: TRow[]) => void;
  newRow: () => TRow;
  addLabel?: string;
  deletable?: (row: TRow) => boolean;
  className?: string;
}

export function EditableTable<TRow extends { id: string }>({
  columns,
  value,
  onChange,
  newRow,
  addLabel = "Añadir fila",
  deletable,
  className,
}: EditableTableProps<TRow>) {
  function handleCellChange(rowId: string, key: keyof TRow, cellValue: unknown) {
    onChange(value.map((r) => (r.id === rowId ? { ...r, [key]: cellValue } : r)));
  }

  function handleAdd() {
    onChange([...value, newRow()]);
  }

  function handleDelete(rowId: string) {
    onChange(value.filter((r) => r.id !== rowId));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
                    col.cellClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {value.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  Sin filas &mdash; pulsa &ldquo;{addLabel}&rdquo; para añadir.
                </td>
              </tr>
            )}
            {value.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/60 last:border-0 transition-colors",
                  i % 2 === 1 && "bg-muted/20",
                  "hover:bg-accent/20",
                )}
              >
                {columns.map((col) => {
                  const raw = (row as Record<string, unknown>)[col.key];

                  if (col.type === "readonly") {
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-1.5 text-muted-foreground whitespace-nowrap",
                          col.cellClassName,
                        )}
                      >
                        {raw == null ? "—" : String(raw)}
                      </td>
                    );
                  }

                  if (col.type === "select") {
                    return (
                      <td key={col.key} className={cn("px-2 py-1", col.cellClassName)}>
                        <select
                          value={String(raw ?? "")}
                          onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                          className="w-full rounded-sm border-0 bg-transparent py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {(col.options ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  }

                  if (col.type === "number") {
                    return (
                      <td key={col.key} className={cn("px-2 py-1", col.cellClassName)}>
                        <input
                          type="number"
                          value={raw == null ? "" : String(raw)}
                          placeholder={col.placeholder ?? "—"}
                          onChange={(e) =>
                            handleCellChange(
                              row.id,
                              col.key,
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          className="w-full min-w-0 rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                    );
                  }

                  if (col.type === "textarea") {
                    return (
                      <td key={col.key} className={cn("px-2 py-1", col.cellClassName)}>
                        <textarea
                          value={String(raw ?? "")}
                          placeholder={col.placeholder}
                          rows={1}
                          onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                          className="w-full min-w-0 resize-none rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                    );
                  }

                  return (
                    <td key={col.key} className={cn("px-2 py-1", col.cellClassName)}>
                      <input
                        type="text"
                        value={String(raw ?? "")}
                        placeholder={col.placeholder}
                        onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                        className="w-full min-w-0 rounded-sm border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                  );
                })}
                <td className="w-10 px-2 py-1">
                  {(!deletable || deletable(row)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                      onClick={() => handleDelete(row.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}
