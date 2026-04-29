import { Shield } from "@/components/kpi/shield";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils/cn";

interface ToolBannerSkeletonProps {
  tool: Tool;
  className?: string;
}

/**
 * Fallback de Suspense mientras un connector fetchea datos.
 * Mantiene exactamente la misma altura/ancho que el ToolSummary final
 * para evitar layout shift al hidratar.
 */
export function ToolBannerSkeleton({ tool, className }: ToolBannerSkeletonProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Skeleton className="h-[42px] w-[200px] rounded-md" />
      <Shield value={null} label={tool.heroLabel} status="neutral" loading size={240} />
      <Skeleton className="h-5 w-32" />
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
