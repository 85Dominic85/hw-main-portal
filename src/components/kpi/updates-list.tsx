import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format";

export interface UpdateItem {
  id: string;
  occurredAt: Date;
  title: string;
  description?: string;
  href?: string;
  external?: boolean;
}

interface UpdatesListProps {
  items: UpdateItem[];
  emptyLabel?: string;
  className?: string;
}

/**
 * Lista compacta de actualizaciones recientes. Se renderiza bajo cada
 * Shield en la home (3-5 items por herramienta).
 */
export function UpdatesList({
  items,
  emptyLabel = "Sin actualizaciones",
  className,
}: UpdatesListProps) {
  if (items.length === 0) {
    return (
      <p className={cn("text-center text-sm text-muted-foreground", className)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => {
        const Wrapper = item.href ? "a" : "div";
        return (
          <li key={item.id}>
            <Wrapper
              {...(item.href
                ? {
                    href: item.href,
                    target: item.external ? "_blank" : undefined,
                    rel: item.external ? "noopener noreferrer" : undefined,
                  }
                : {})}
              className={cn(
                "group block rounded-md border border-transparent px-3 py-2 transition-colors",
                item.href && "hover:border-border/60 hover:bg-accent/50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <time
                    dateTime={item.occurredAt.toISOString()}
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {formatRelativeTime(item.occurredAt)}
                  </time>
                  {item.external && (
                    <ArrowUpRight
                      className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </Wrapper>
          </li>
        );
      })}
    </ul>
  );
}
