"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarChartSeries {
  /** Identificador interno de la serie (key del objeto en `data`). */
  dataKey: string;
  /** Label visible en leyenda y tooltip. */
  label: string;
  /** Color CSS (HSL/hex). */
  color: string;
}

interface BarChartRechartsProps {
  /** Cada item es un row con `xLabel` + las claves de cada serie. */
  data: Array<Record<string, string | number>>;
  /** Key del campo de eje X (ej. "label" o "weekStart"). */
  xKey: string;
  series: BarChartSeries[];
  /** Sufijo opcional al valor en tooltip/leyenda (ej. " pedidos"). */
  valueSuffix?: string;
}

/**
 * Render puro Recharts para gráficos de barras agrupadas (multi-serie).
 * Aislado en su propio módulo para cargarlo con `dynamic({ ssr: false })`
 * desde `<BarChartCard>` y evitar errores de SSR (recharts toca window).
 */
export default function BarChartRecharts({
  data,
  xKey,
  series,
  valueSuffix = "",
}: BarChartRechartsProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey={xKey}
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
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
        <Legend
          iconType="rect"
          iconSize={10}
          wrapperStyle={{ fontSize: "0.75rem", paddingTop: "8px" }}
        />
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label}
            fill={s.color}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
