"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type HwToolPeriod = "today" | "7d" | "30d" | "month";

const PRESETS: { id: HwToolPeriod; label: string; description: string }[] = [
  { id: "today", label: "Hoy", description: "Solo el día de hoy" },
  { id: "7d", label: "7d", description: "Últimos 7 días" },
  { id: "30d", label: "30d", description: "Últimos 30 días" },
  { id: "month", label: "Mes", description: "Mes actual" },
];

const DEFAULT_PERIOD: HwToolPeriod = "month";

interface HwToolPeriodSelectorProps {
  className?: string;
}

/**
 * Selector de periodo simple para la pestaña /hwtool.
 * Sincroniza el preset con `?period=` en la URL.
 *
 * No tiene rango custom todavía — se añadirá en una iteración posterior
 * con un calendar (shadcn `Calendar` + popover).
 */
export function HwToolPeriodSelector({ className }: HwToolPeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("period") as HwToolPeriod | null) ?? DEFAULT_PERIOD;
  const validCurrent: HwToolPeriod = PRESETS.some((p) => p.id === current)
    ? current
    : DEFAULT_PERIOD;

  function setPeriod(next: HwToolPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_PERIOD) {
      params.delete("period");
    } else {
      params.set("period", next);
    }
    const query = params.toString();
    router.push(`/hwtool${query ? `?${query}` : ""}`);
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
        const active = p.id === validCurrent;
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

export function periodToFilter(period: HwToolPeriod | null | undefined): {
  from?: Date;
  to?: Date;
} {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  switch (period) {
    case "today":
      return { from: today, to: now };
    case "7d": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 6);
      return { from, to: now };
    }
    case "30d": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from, to: now };
    }
    case "month":
    default: {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { from, to: now };
    }
  }
}
