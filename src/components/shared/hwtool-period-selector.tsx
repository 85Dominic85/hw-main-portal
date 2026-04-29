"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  HWTOOL_DEFAULT_PERIOD,
  isValidPeriod,
  type HwToolPeriod,
} from "@/lib/hwtool/period";

const PRESETS: { id: HwToolPeriod; label: string; description: string }[] = [
  { id: "today", label: "Hoy", description: "Solo el día de hoy" },
  { id: "7d", label: "7d", description: "Últimos 7 días" },
  { id: "30d", label: "30d", description: "Últimos 30 días" },
  { id: "month", label: "Mes", description: "Mes actual" },
];

interface HwToolPeriodSelectorProps {
  className?: string;
}

/**
 * Selector de periodo simple para la pestaña /hwtool.
 * Sincroniza el preset con `?period=` en la URL.
 *
 * Los helpers `periodToFilter`/`isValidPeriod`/`HwToolPeriod` viven en
 * `@/lib/hwtool/period` (módulo neutro server/client) — antes vivían
 * aquí y rompían el SSR cuando el page.tsx (server) los importaba.
 */
export function HwToolPeriodSelector({ className }: HwToolPeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("period");
  const current: HwToolPeriod = isValidPeriod(raw) ? raw : HWTOOL_DEFAULT_PERIOD;

  function setPeriod(next: HwToolPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === HWTOOL_DEFAULT_PERIOD) {
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
