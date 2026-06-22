"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleGuestDashboards } from "@/server/actions/settings";
import { cn } from "@/lib/utils/cn";

export function GuestDashboardsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    startTransition(async () => {
      const res = await toggleGuestDashboards(next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setEnabled(next);
      toast.success(
        next
          ? "Dashboards de detalle visibles para invitados."
          : "Dashboards ocultos a invitados (solo la home).",
      );
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm">
        <p className="font-medium text-foreground">
          {enabled ? "Visibles para invitados" : "Privados (solo admins)"}
        </p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "Cualquiera puede ver /mainops, /hwtool y /hsm."
            : "Los invitados solo ven la home (hero shields)."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={isPending}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
          enabled ? "bg-status-ok" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
