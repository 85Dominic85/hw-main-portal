"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  HSM_DEFAULT_PERIOD,
  isValidPeriod,
  type HsmPeriod,
} from "@/lib/hsm/period";

const PRESETS: { id: HsmPeriod; label: string; description: string }[] = [
  { id: "today", label: "Hoy", description: "Solo hoy" },
  { id: "7d", label: "7d", description: "Últimos 7 días" },
  { id: "30d", label: "30d", description: "Últimos 30 días" },
  { id: "month", label: "Mes", description: "Mes actual" },
];

export function HsmPeriodSelector({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("period");
  const current: HsmPeriod = isValidPeriod(raw) ? raw : HSM_DEFAULT_PERIOD;

  function setPeriod(next: HsmPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === HSM_DEFAULT_PERIOD) params.delete("period");
    else params.set("period", next);
    const query = params.toString();
    router.push(`/hsm${query ? `?${query}` : ""}`);
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
