import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { Tool } from "@/lib/tools";

/**
 * <ToolShortcut> — botón compacto que abre la herramienta externa
 * en una pestaña nueva. Pensado para ir **encima de cada Shield**:
 * iguala el ancho del escudo cuando se le pasa `style.width` o un
 * wrapper con tamaño fijo, así la asociación visual es directa y
 * no parece "perdido" sobre un escudo grande.
 *
 * Polish (siguiendo emil-design-eng):
 * - Highlight bisel arriba (gradient overlay 5% blanco) → relieve sutil.
 * - Lift `hover:-translate-y-0.5` + sombra subtle → feedback "se eleva".
 * - Active hunde 1px y reduce sombra → tactil al pulsar.
 * - bg-secondary > bg-card en contraste contra el fondo del portal.
 */

interface ToolShortcutProps {
  tool: Tool;
  /** Si true, ocupa el ancho del contenedor padre. */
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ToolShortcut({ tool, fullWidth, className, style }: ToolShortcutProps) {
  return (
    <a
      href={tool.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md",
        "border border-border bg-secondary px-4 py-2.5",
        "font-mono text-sm font-bold tracking-wide text-foreground",
        // Sombra base sutil, mayor en hover, mínima en active
        "shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)_inset,0_1px_2px_0_hsl(var(--background)/0.5)]",
        // Microinteracciones (emil-design-eng)
        "transition-all duration-150 ease-out",
        "hover:-translate-y-0.5 hover:bg-secondary/80 hover:border-foreground/30",
        "hover:shadow-[0_1px_0_0_hsl(var(--foreground)/0.06)_inset,0_4px_12px_-2px_hsl(var(--background)/0.7)]",
        "active:translate-y-0 active:scale-[0.99]",
        "active:shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)_inset]",
        // Foco accesible
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        fullWidth && "w-full",
        className,
      )}
      title={`Abrir ${tool.displayName} en pestaña nueva`}
    >
      {/* Highlight bisel — gradient sutil arriba simulando luz superior */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent"
      />
      <span className="relative">{tool.shortLabel}</span>
      <ArrowUpRight
        className="relative h-4 w-4 text-foreground/60 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden="true"
        strokeWidth={2.5}
      />
    </a>
  );
}
