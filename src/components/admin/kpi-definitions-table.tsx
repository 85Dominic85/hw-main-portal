"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Power, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  upsertKpiDefinition,
  toggleKpiDefinitionActive,
  deleteKpiDefinition,
  type KpiDefInput,
} from "@/server/actions/kpi-definitions";
import type { ReportKpiDefinition } from "@/lib/db/schema/reports";

const SOURCE_LABELS: Record<string, string> = {
  mainops: "MainOPS",
  hwtool: "HW Tool",
  hsm: "HSM",
  manual: "Manual",
};

const SECTION_KEYS = [
  "executiveSummary",
  "configuraciones",
  "envios",
  "soporte",
  "performance",
];

const EMPTY_FORM: KpiDefInput = {
  kpiKey: "",
  label: "",
  unit: "",
  source: "manual",
  sectionKey: "executiveSummary",
  target: null,
  warnDelta: null,
  dangerDelta: null,
  direction: "higher-is-better",
  owner: "",
};

interface Props {
  definitions: ReportKpiDefinition[];
}

export function KpiDefinitionsTable({ definitions: initial }: Props) {
  const [editing, setEditing] = useState<string | null>(null); // id or "new"
  const [form, setForm] = useState<KpiDefInput>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function startNew() {
    setForm(EMPTY_FORM);
    setEditing("new");
  }

  function startEdit(def: ReportKpiDefinition) {
    setForm({
      id: def.id,
      kpiKey: def.kpiKey,
      label: def.label,
      unit: def.unit ?? "",
      source: def.source as KpiDefInput["source"],
      sectionKey: def.sectionKey,
      target: def.target != null ? Number(def.target) : null,
      warnDelta: def.warnDelta != null ? Number(def.warnDelta) : null,
      dangerDelta: def.dangerDelta != null ? Number(def.dangerDelta) : null,
      direction: def.direction as KpiDefInput["direction"],
      owner: def.owner ?? "",
    });
    setEditing(def.id);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function patch<K extends keyof KpiDefInput>(key: K, value: KpiDefInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertKpiDefinition(form);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editing === "new" ? "KPI creado" : "KPI actualizado");
      cancelEdit();
    });
  }

  function handleToggle(def: ReportKpiDefinition) {
    startTransition(async () => {
      const result = await toggleKpiDefinitionActive(def.id, !def.active);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleDelete(def: ReportKpiDefinition) {
    if (!confirm(`¿Eliminar "${def.label}"? Solo se puede si está inactivo.`)) return;
    startTransition(async () => {
      const result = await deleteKpiDefinition(def.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("KPI eliminado");
    });
  }

  const grouped = SECTION_KEYS.reduce<Record<string, ReportKpiDefinition[]>>(
    (acc, sk) => {
      acc[sk] = initial.filter((d) => d.sectionKey === sk);
      return acc;
    },
    {},
  );
  const uncategorized = initial.filter((d) => !SECTION_KEYS.includes(d.sectionKey));
  if (uncategorized.length) grouped["otros"] = uncategorized;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={startNew} disabled={editing !== null}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva definición
        </Button>
      </div>

      {/* Formulario nuevo */}
      {editing === "new" && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-semibold">Nueva definición de KPI</p>
          <KpiDefForm form={form} patch={patch} onSave={handleSave} onCancel={cancelEdit} isPending={isPending} />
        </div>
      )}

      {/* Tabla por sección */}
      {Object.entries(grouped).map(([sectionKey, defs]) => {
        if (!defs.length && editing !== "new") return null;
        return (
          <div key={sectionKey}>
            <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
              {sectionKey}
            </h3>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left">Clave</th>
                    <th className="px-3 py-2 text-left">Etiqueta</th>
                    <th className="px-3 py-2 text-left">Unidad</th>
                    <th className="px-3 py-2 text-left">Fuente</th>
                    <th className="px-3 py-2 text-right">Target</th>
                    <th className="px-3 py-2 text-right">Warn Δ</th>
                    <th className="px-3 py-2 text-right">Danger Δ</th>
                    <th className="px-3 py-2 text-left">Owner</th>
                    <th className="w-28 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {defs.map((def) =>
                    editing === def.id ? (
                      <tr key={def.id} className="border-b border-border/60 bg-accent/10">
                        <td colSpan={9} className="px-3 py-3">
                          <KpiDefForm
                            form={form}
                            patch={patch}
                            onSave={handleSave}
                            onCancel={cancelEdit}
                            isPending={isPending}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={def.id}
                        className={cn(
                          "border-b border-border/40 last:border-0 hover:bg-accent/10",
                          !def.active && "opacity-50",
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-xs">{def.kpiKey}</td>
                        <td className="px-3 py-2 font-medium">{def.label}</td>
                        <td className="px-3 py-2 text-muted-foreground">{def.unit ?? "—"}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {SOURCE_LABELS[def.source] ?? def.source}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{def.target ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-status-warn">
                          {def.warnDelta ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-status-danger">
                          {def.dangerDelta ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{def.owner ?? "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEdit(def)}
                              disabled={isPending || editing !== null}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                def.active ? "text-status-ok" : "text-muted-foreground",
                              )}
                              onClick={() => handleToggle(def)}
                              disabled={isPending}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                            {!def.active && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                                onClick={() => handleDelete(def)}
                                disabled={isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                  {defs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-5 text-center text-xs text-muted-foreground">
                        Sin definiciones en esta sección
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {initial.length === 0 && editing !== "new" && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No hay definiciones de KPI todavía. Pulsa &ldquo;Nueva definición&rdquo; para añadir la primera.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Formulario inline ─────────────────────────────────────────────────────────

interface FormProps {
  form: KpiDefInput;
  patch: <K extends keyof KpiDefInput>(key: K, value: KpiDefInput[K]) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function KpiDefForm({ form, patch, onSave, onCancel, isPending }: FormProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Clave (kpiKey)</label>
          <Input
            value={form.kpiKey}
            onChange={(e) => patch("kpiKey", e.target.value)}
            placeholder="config_total"
            className="h-8 text-xs font-mono"
            disabled={!!form.id}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Etiqueta</label>
          <Input
            value={form.label}
            onChange={(e) => patch("label", e.target.value)}
            placeholder="Configuraciones totales"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Unidad</label>
          <Input
            value={form.unit ?? ""}
            onChange={(e) => patch("unit", e.target.value)}
            placeholder="un. / % / €"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Fuente</label>
          <select
            value={form.source}
            onChange={(e) => patch("source", e.target.value as KpiDefInput["source"])}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="mainops">MainOPS</option>
            <option value="hwtool">HW Tool</option>
            <option value="hsm">HSM</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Sección</label>
          <select
            value={form.sectionKey}
            onChange={(e) => patch("sectionKey", e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            {SECTION_KEYS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Dirección</label>
          <select
            value={form.direction}
            onChange={(e) => patch("direction", e.target.value as KpiDefInput["direction"])}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="higher-is-better">Mayor es mejor</option>
            <option value="lower-is-better">Menor es mejor</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Owner</label>
          <Input
            value={form.owner ?? ""}
            onChange={(e) => patch("owner", e.target.value)}
            placeholder="jj / guille / domi"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Target</label>
          <Input
            type="number"
            value={form.target ?? ""}
            onChange={(e) =>
              patch("target", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="—"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Warn Δ</label>
          <Input
            type="number"
            value={form.warnDelta ?? ""}
            onChange={(e) =>
              patch("warnDelta", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="—"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Danger Δ</label>
          <Input
            type="number"
            value={form.dangerDelta ?? ""}
            onChange={(e) =>
              patch("dangerDelta", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="—"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={isPending || !form.kpiKey || !form.label}>
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Guardar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
