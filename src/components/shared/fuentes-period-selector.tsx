"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  HOME_DEFAULT_PERIOD,
  isValidHomePeriod,
  type HomePeriod,
} from "@/lib/home/period";

const PRESETS: { id: HomePeriod; label: string; description: string }[] = [
  { id: "today", label: "Hoy", description: "Solo el día de hoy" },
  { id: "7d", label: "7d", description: "Últimos 7 días" },
  { id: "15d", label: "15d", description: "Últimos 15 días" },
  { id: "30d", label: "30d", description: "Últimos 30 días" },
];

/**
 * Selector de periodo para la pestaña /fuentes. Escribe `?period=` en la URL
 * (mismo patrón que los selectores de las pestañas de herramientas). Reutiliza
 * los helpers de `@/lib/home/period`.
 */
export function FuentesPeriodSelector({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("period");
  const current: HomePeriod = isValidHomePeriod(raw) ? raw : HOME_DEFAULT_PERIOD;

  function setPeriod(next: HomePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === HOME_DEFAULT_PERIOD) params.delete("period");
    else params.set("period", next);
    const query = params.toString();
    router.push(`/fuentes${query ? `?${query}` : ""}`);
  }

  return (
    <div
      role="tablist"
      aria-label="Periodo"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-card p-1",
        className,
      )}
    >
      {PRESETS.map((p) => {
        const active = p.id === current;
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
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        );
      })}
    </div>
  );
}
