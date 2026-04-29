"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface PieChartRechartsSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface PieChartRechartsProps {
  data: PieChartRechartsSlice[];
  showCenterTotal?: boolean;
  valueSuffix?: string;
}

/**
 * Render puro Recharts. Aislado en su propio módulo para poder cargarlo
 * con `dynamic({ ssr: false })` desde `<PieChartCard>` y evitar errores
 * de SSR (recharts toca window en algunas inicializaciones).
 */
export default function PieChartRecharts({
  data,
  showCenterTotal = false,
  valueSuffix = "",
}: PieChartRechartsProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={showCenterTotal ? 56 : 0}
          outerRadius={88}
          strokeWidth={1}
          stroke="hsl(var(--background))"
          isAnimationActive={false}
        >
          {data.map((slice) => (
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
  );
}
