"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * Recharts toca `window` en algunas inicializaciones internas; al meterlo
 * en SSR puede tirar excepciones que rompen la página.
 * Lo cargamos solo en cliente con `dynamic({ ssr: false })`.
 */
const PieChartRecharts = dynamic(() => import("./pie-chart-recharts"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-md" />,
});

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
              <PieChartRecharts
                data={slicesWithColor}
                showCenterTotal={showCenterTotal}
                valueSuffix={valueSuffix}
              />
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
