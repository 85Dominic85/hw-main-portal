import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  status?: "ok" | "warn" | "danger" | "neutral";
  className?: string;
}

const STATUS_BORDER: Record<NonNullable<StatCardProps["status"]>, string> = {
  ok: "border-status-ok/30",
  warn: "border-status-warn/30",
  danger: "border-status-danger/30",
  neutral: "border-border",
};

/**
 * Tarjeta KPI compacta — título arriba, número grande tabular abajo,
 * descripción opcional bajo el número.
 */
export function StatCard({
  title,
  value,
  description,
  status = "neutral",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("h-full transition-colors", STATUS_BORDER[status], className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
