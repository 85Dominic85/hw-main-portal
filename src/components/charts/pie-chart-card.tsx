"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface PieChartSlice {
  /** Identificador interno (no se muestra). */
  key: string;
  /** Texto visible en leyenda y tooltip. */
  label: string;
  /** Valor numérico (la API real ya devuelve enteros y porcentajes). */
  value: number;
  /** Color CSS (HSL/hex). */
  color: string;
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieChartSlice[];
  /** Sufijo opcional al valor en tooltip/leyenda (ej. "%", "configs"). */
  valueSuffix?: string;
  /** Si la suma de los slices se debe mostrar en el centro. */
  showCenterTotal?: boolean;
  centerLabel?: string;
  className?: string;
}

const PALETTE_FALLBACK = [
  "hsl(var(--status-ok))",
  "hsl(var(--status-warn))",
  "hsl(var(--status-danger))",
  "hsl(220 70% 60%)",
  "hsl(280 70% 60%)",
  "hsl(195 70% 55%)",
];

/**
 * Tarjeta con un pie chart y leyenda lateral.
 * Diseño coherente con el resto del portal: bg-card, borde sutil,
 * tipografía tabular para los valores.
 */
export function PieChartCard({
  title,
  description,
  data,
  valueSuffix = "",
  showCenterTotal = false,
  centerLabel,
  className,
}: PieChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Asigna color de fallback si no viene en el slice.
  const slicesWithColor = data.map((d, i) => ({
    ...d,
    color: d.color || PALETTE_FALLBACK[i % PALETTE_FALLBACK.length]!,
  }));

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Sin datos en el rango seleccionado
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr,auto]">
            <div className="relative h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slicesWithColor}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={showCenterTotal ? 56 : 0}
                    outerRadius={88}
                    strokeWidth={1}
                    stroke="hsl(var(--background))"
                  >
                    {slicesWithColor.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString("es-ES")}${valueSuffix}`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {showCenterTotal && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    {total.toLocaleString("es-ES")}
                  </span>
                  {centerLabel && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {centerLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ul className="flex flex-col gap-2 text-xs sm:min-w-[140px]">
              {slicesWithColor.map((slice) => {
                const percent = total > 0 ? (slice.value / total) * 100 : 0;
                return (
                  <li key={slice.key} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="flex-1 truncate" title={slice.label}>
                      {slice.label}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {slice.value.toLocaleString("es-ES")}
                      <span className="ml-1 text-muted-foreground/70">
                        ({percent.toFixed(0)}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
