import Link from "next/link";

import { Shield, type ShieldStatus, type ShieldVariant } from "@/components/kpi/shield";
import { ToolShortcut } from "@/components/kpi/tool-shortcut";
import { UpdatesList, type UpdateItem } from "@/components/kpi/updates-list";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils/cn";

/** Aspect del SVG del Shield (viewBox 200x240). El ancho del escudo = size / aspect. */
const SHIELD_ASPECT = 240 / 200;

interface ToolSummaryProps {
  tool: Tool;
  /** Valor del KPI hero en base 100. `null` si no hay dato. */
  heroValue: number | null;
  /** Estado semáforo derivado del valor + umbrales. */
  heroStatus: ShieldStatus;
  /** Variante de forma del escudo. Default `rivets-double` (decidido tras /lab/shields). */
  shieldVariant?: ShieldVariant;
  /** Tamaño (alto) del escudo. Default 240. */
  shieldSize?: number;
  /** Updates recientes para mostrar bajo el escudo. */
  updates: UpdateItem[];
  className?: string;
}

/**
 * Bloque vertical de la home — orden:
 *   1. ToolShortcut con el ancho del escudo (asociación visual directa)
 *   2. Shield con KPI hero
 *   3. Nombre de la herramienta (link a la pestaña interna)
 *   4. Lista de updates recientes
 */
export function ToolSummary({
  tool,
  heroValue,
  heroStatus,
  shieldVariant = "rivets-double",
  shieldSize = 240,
  updates,
  className,
}: ToolSummaryProps) {
  const shieldWidth = shieldSize / SHIELD_ASPECT;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div style={{ width: shieldWidth }}>
        <ToolShortcut tool={tool} fullWidth />
      </div>

      <Shield
        value={heroValue}
        label={tool.heroLabel}
        status={heroStatus}
        variant={shieldVariant}
        size={shieldSize}
      />

      <Link
        href={tool.internalPath}
        className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
      >
        {tool.displayName}
      </Link>

      <UpdatesList items={updates} className="w-full max-w-xs" />
    </div>
  );
}
