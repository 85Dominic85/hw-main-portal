"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  HOME_DEFAULT_PERIOD,
  homePeriodToRange,
  isValidHomePeriod,
  type HomePeriod,
} from "@/lib/home/period";

/**
 * Selector de periodo global de la home — botones segmentados con
 * fallback a date pickers cuando el usuario elige "Custom…".
 *
 * Estado en URL (`?period=...&from=...&to=...`) para que el server fetche
 * el rango correcto en SSR. Los 4 presets escriben solo `?period=`; "custom"
 * escribe `?period=custom&from=YYYY-MM-DD&to=YYYY-MM-DD`. Si esos valores
 * son inválidos, `homePeriodToRange()` cae al default sin romper.
 *
 * Diseño visual (mismo patrón que MainOpsPeriodSelector y HwToolPeriodSelector
 * para coherencia entre home y detalles):
 *   - pills compactos en una `<div role="tablist">` con border + bg-card.
 *   - botón "Custom…" alterna la fila inferior (2 inputs date + Aplicar).
 *   - cuando hay rango custom activo, el botón muestra el rango seleccionado.
 */

const PRESETS: { id: Exclude<HomePeriod, "custom">; label: string; description: string }[] = [
  { id: "month", label: "Mes en curso", description: "Del día 1 del mes a hoy" },
  { id: "7d", label: "7d", description: "Últimos 7 días (rolling)" },
  { id: "15d", label: "15d", description: "Últimos 15 días (rolling)" },
  { id: "30d", label: "30d", description: "Últimos 30 días (rolling)" },
];

/** Formato YYYY-MM-DD para usar como `min`/`max`/`value` de inputs date. */
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface HomePeriodSelectorProps {
  className?: string;
}

export function HomePeriodSelector({ className }: HomePeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPeriod = searchParams.get("period");
  const rawFrom = searchParams.get("from");
  const rawTo = searchParams.get("to");

  const current: HomePeriod = isValidHomePeriod(rawPeriod) ? rawPeriod : HOME_DEFAULT_PERIOD;
  const isCustomActive = current === "custom";

  // Estado local para los inputs date — pre-fill con el rango actual o con
  // el mes en curso si el user nunca eligió custom todavía.
  const initialRange = React.useMemo(
    () => homePeriodToRange(current, rawFrom, rawTo),
    [current, rawFrom, rawTo],
  );

  const [showCustom, setShowCustom] = React.useState(isCustomActive);
  const [draftFrom, setDraftFrom] = React.useState(isoDate(initialRange.from));
  const [draftTo, setDraftTo] = React.useState(isoDate(initialRange.to));

  // Sincroniza visibility cuando la URL cambia (ej. navegación atrás/adelante).
  React.useEffect(() => {
    setShowCustom(isCustomActive);
    if (isCustomActive) {
      setDraftFrom(isoDate(initialRange.from));
      setDraftTo(isoDate(initialRange.to));
    }
  }, [isCustomActive, initialRange]);

  function pushParams(next: URLSearchParams) {
    const query = next.toString();
    router.push(`/${query ? `?${query}` : ""}`, { scroll: false });
  }

  function setPreset(next: Exclude<HomePeriod, "custom">) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === HOME_DEFAULT_PERIOD) params.delete("period");
    else params.set("period", next);
    params.delete("from");
    params.delete("to");
    pushParams(params);
    setShowCustom(false);
  }

  function toggleCustom() {
    if (showCustom) {
      // Cerrar sin aplicar — mantiene la URL como esté.
      setShowCustom(false);
      return;
    }
    setShowCustom(true);
  }

  function applyCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!draftFrom || !draftTo) return;
    if (draftFrom > draftTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", draftFrom);
    params.set("to", draftTo);
    pushParams(params);
  }

  // Hoy en YYYY-MM-DD para impedir seleccionar fechas futuras.
  const todayIso = isoDate(new Date());
  const customRangeLabel =
    isCustomActive && rawFrom && rawTo ? `${rawFrom} → ${rawTo}` : "Custom…";
  const isCustomDraftValid =
    !!draftFrom && !!draftTo && draftFrom <= draftTo && draftTo <= todayIso;

  return (
    <div className={cn("flex flex-col items-end gap-2", className)}>
      <div
        role="tablist"
        aria-label="Periodo de consulta"
        className="inline-flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1"
      >
        {PRESETS.map((p) => {
          const active = !isCustomActive && current === p.id;
          return (
            <Button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 px-3 font-mono text-xs", active && "shadow-sm")}
              title={p.description}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </Button>
          );
        })}
        <Button
          type="button"
          role="tab"
          aria-selected={isCustomActive}
          aria-expanded={showCustom}
          variant={isCustomActive ? "secondary" : "ghost"}
          size="sm"
          className={cn("h-8 px-3 font-mono text-xs", isCustomActive && "shadow-sm")}
          title="Elegir un rango personalizado"
          onClick={toggleCustom}
        >
          {customRangeLabel}
        </Button>
      </div>

      {showCustom && (
        <form
          onSubmit={applyCustom}
          className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-card p-2"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="home-from" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Desde
            </Label>
            <Input
              id="home-from"
              type="date"
              value={draftFrom}
              max={draftTo || todayIso}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="h-8 w-[150px] font-mono text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="home-to" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Hasta
            </Label>
            <Input
              id="home-to"
              type="date"
              value={draftTo}
              min={draftFrom}
              max={todayIso}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-8 w-[150px] font-mono text-xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!isCustomDraftValid}
            className="h-8"
          >
            Aplicar
          </Button>
        </form>
      )}
    </div>
  );
}
