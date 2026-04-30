"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

const BarChartRecharts = dynamic(() => import("./bar-chart-recharts"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-md" />,
});

export interface BarChartSeries {
  dataKey: string;
  label: string;
  color: string;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  /** Cada item es un row con `xKey` + las claves de cada serie. */
  data: Array<Record<string, string | number>>;
  /** Key del campo de eje X. */
  xKey: string;
  series: BarChartSeries[];
  valueSuffix?: string;
  /** Altura del chart en px (default 260). */
  height?: number;
  className?: string;
}

/**
 * Tarjeta con un gráfico de barras agrupadas. Mismo patrón que `<PieChartCard>`:
 * Recharts cargado via `dynamic({ ssr: false })` para evitar petadas en SSR.
 */
export function BarChartCard({
  title,
  description,
  data,
  xKey,
  series,
  valueSuffix = "",
  height = 260,
  className,
}: BarChartCardProps) {
  const isEmpty = data.length === 0;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
          >
            Sin datos en el rango seleccionado
          </div>
        ) : (
          <div className="w-full" style={{ height }}>
            <BarChartRecharts
              data={data}
              xKey={xKey}
              series={series}
              valueSuffix={valueSuffix}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
