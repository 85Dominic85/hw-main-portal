import * as React from "react";

import { cn } from "@/lib/utils/cn";
import { formatPercentFromBase100 } from "@/lib/utils/format";

/**
 * <Shield> — escudo heráldico que muestra el KPI hero de una herramienta.
 *
 * Soporta 6 variantes de forma — todas inscritas en viewBox 200x240
 * para que el resto del layout no cambie al alternar entre ellas:
 *
 * - `heater`   → blasón clásico medieval (forma "heater")
 * - `rivets`   → heater con remaches en el borde (más defensivo)
 * - `kite`     → escudo de torneo elongado (más esbelto)
 * - `hex`      → hexagonal moderno (geometría tech)
 * - `double`   → doble borde simulando blindaje en capas
 * - `modern`   → octagonal con esquinas biseladas (placa militar)
 *
 * El borde se tinta según el `status` (semáforo) y el porcentaje
 * se renderiza centrado con números tabulares grandes.
 */

export type ShieldStatus = "ok" | "warn" | "danger" | "neutral";

export type ShieldVariant =
  | "heater"
  | "rivets"
  | "kite"
  | "hex"
  | "double"
  | "modern"
  | "rivets-double";

const STATUS_CLASSES: Record<
  ShieldStatus,
  { stroke: string; glow: string; text: string; rivet: string }
> = {
  ok: {
    stroke: "stroke-status-ok",
    glow: "drop-shadow-[0_0_24px_hsl(var(--status-ok)/0.35)]",
    text: "text-status-ok",
    rivet: "fill-status-ok",
  },
  warn: {
    stroke: "stroke-status-warn",
    glow: "drop-shadow-[0_0_24px_hsl(var(--status-warn)/0.4)]",
    text: "text-status-warn",
    rivet: "fill-status-warn",
  },
  danger: {
    stroke: "stroke-status-danger",
    glow: "drop-shadow-[0_0_24px_hsl(var(--status-danger)/0.4)]",
    text: "text-status-danger",
    rivet: "fill-status-danger",
  },
  neutral: {
    stroke: "stroke-muted-foreground/40",
    glow: "",
    text: "text-foreground",
    rivet: "fill-muted-foreground",
  },
};

// Path heráldico clásico (heater) — top recto + costados curvos + punta V suave.
const PATH_HEATER =
  "M 14 8 L 186 8 L 186 92 C 186 168 148 214 100 234 C 52 214 14 168 14 92 Z";

// Kite — más esbelto, costados ligeramente cóncavos, punta larga.
const PATH_KITE =
  "M 36 8 L 164 8 C 172 84 148 172 100 234 C 52 172 28 84 36 8 Z";

// Hexagonal moderno — vértices nítidos, geometría tech.
const PATH_HEX = "M 100 8 L 186 56 L 186 184 L 100 234 L 14 184 L 14 56 Z";

// Modern badge — octagonal con esquinas biseladas + base en punta suave.
const PATH_MODERN =
  "M 30 8 L 170 8 L 192 30 L 192 154 C 192 200 158 228 100 234 C 42 228 8 200 8 154 L 8 30 Z";

// Inner shield para variant `double` (95% del heater, ligeramente desplazado).
const PATH_HEATER_INNER =
  "M 30 22 L 170 22 L 170 90 C 170 158 138 198 100 216 C 62 198 30 158 30 90 Z";

// Posiciones de los remaches (rivet variant).
const RIVETS: { cx: number; cy: number }[] = [
  { cx: 30, cy: 24 },
  { cx: 170, cy: 24 },
  { cx: 14, cy: 90 },
  { cx: 186, cy: 90 },
  { cx: 38, cy: 178 },
  { cx: 162, cy: 178 },
];

interface ShieldProps {
  value: number | null;
  label: string;
  status?: ShieldStatus;
  variant?: ShieldVariant;
  size?: number;
  loading?: boolean;
  className?: string;
}

export function Shield({
  value,
  label,
  status = "neutral",
  variant = "heater",
  size = 200,
  loading = false,
  className,
}: ShieldProps) {
  const aspect = 240 / 200;
  const height = size;
  const width = size / aspect;
  const styles = STATUS_CLASSES[status];

  const path = (() => {
    switch (variant) {
      case "kite":
        return PATH_KITE;
      case "hex":
        return PATH_HEX;
      case "modern":
        return PATH_MODERN;
      case "heater":
      case "rivets":
      case "double":
      case "rivets-double":
      default:
        return PATH_HEATER;
    }
  })();

  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      style={{ width }}
    >
      <div className={cn("relative", styles.glow)} style={{ width, height }}>
        <svg
          viewBox="0 0 200 240"
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="overflow-visible"
        >
          <defs>
            {/* Gradiente principal — metálico oscuro */}
            <linearGradient id={`shield-fill-${variant}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="1" />
              <stop offset="50%" stopColor="hsl(var(--background))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="1" />
            </linearGradient>
            {/* Brillo superior izquierdo, simula pulido del metal */}
            <linearGradient id={`shield-shine-${variant}`} x1="0.15" x2="0.55" y1="0" y2="0.6">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
            {/* Sombra interna inferior para sensación volumétrica */}
            <radialGradient id={`shield-inner-${variant}`} cx="0.5" cy="1.1" r="0.7">
              <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Cuerpo principal */}
          <path
            d={path}
            fill={`url(#shield-fill-${variant})`}
            className={cn("transition-all", styles.stroke)}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Brillo superior */}
          <path d={path} fill={`url(#shield-shine-${variant})`} stroke="none" />

          {/* Sombra interna inferior */}
          <path d={path} fill={`url(#shield-inner-${variant})`} stroke="none" />

          {/* Variant-specific decorations */}
          {variant === "heater" && (
            <line
              x1="22"
              x2="178"
              y1="60"
              y2="60"
              className={cn("opacity-40", styles.stroke)}
              strokeWidth={1}
            />
          )}

          {(variant === "rivets" || variant === "rivets-double") &&
            RIVETS.map((r, i) => (
              <circle
                key={i}
                cx={r.cx}
                cy={r.cy}
                r={3}
                className={cn("opacity-90", styles.rivet)}
              />
            ))}

          {variant === "kite" && (
            <>
              {/* Línea diagonal de "pala" del kite */}
              <line
                x1="100"
                y1="8"
                x2="100"
                y2="220"
                className={cn("opacity-15", styles.stroke)}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            </>
          )}

          {variant === "hex" && (
            <>
              {/* Líneas internas paralelas — refuerzo geométrico */}
              <line
                x1="30"
                x2="170"
                y1="68"
                y2="68"
                className={cn("opacity-25", styles.stroke)}
                strokeWidth={1}
              />
              <line
                x1="30"
                x2="170"
                y1="172"
                y2="172"
                className={cn("opacity-25", styles.stroke)}
                strokeWidth={1}
              />
            </>
          )}

          {(variant === "double" || variant === "rivets-double") && (
            <path
              d={PATH_HEATER_INNER}
              fill="none"
              className={cn("opacity-50", styles.stroke)}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          )}

          {variant === "modern" && (
            <>
              {/* Banda diagonal estilo placa militar */}
              <line
                x1="8"
                y1="60"
                x2="192"
                y2="60"
                className={cn("opacity-30", styles.stroke)}
                strokeWidth={1}
              />
              <line
                x1="8"
                y1="184"
                x2="192"
                y2="184"
                className={cn("opacity-30", styles.stroke)}
                strokeWidth={1}
              />
            </>
          )}
        </svg>

        {/* Capa de contenido */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-4">
          {loading ? (
            <div className="h-10 w-20 animate-pulse rounded bg-muted" />
          ) : value === null ? (
            <span className="font-mono text-4xl font-semibold text-muted-foreground tabular-nums">
              —
            </span>
          ) : (
            <span
              className={cn(
                "font-mono text-4xl font-semibold tabular-nums tracking-tight",
                styles.text,
              )}
            >
              {formatPercentFromBase100(value)}
            </span>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
