"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tagLabel } from "@/lib/bitacora/tags";
import { cn } from "@/lib/utils/cn";

interface BitacoraFiltersProps {
  authors: { email: string; name: string | null }[];
  tags: { tag: string; count: number }[];
}

/**
 * Filtros de la bitácora. El estado vive en la URL, así que un filtro se puede
 * compartir por enlace y sobrevive a recargar la página.
 *
 * Se usa `useSearchParams` + `router.replace` en vez de nuqs porque son cuatro
 * parámetros planos y no hace falta el tipado ni el shallow routing.
 */
export function BitacoraFilters({ authors, tags }: BitacoraFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentAuthor = params.get("author") ?? "";
  const currentTag = params.get("tag") ?? "";
  const currentQ = params.get("q") ?? "";
  const currentFrom = params.get("from") ?? "";
  const currentTo = params.get("to") ?? "";

  const [q, setQ] = React.useState(currentQ);
  React.useEffect(() => setQ(currentQ), [currentQ]);

  const hasFilters = Boolean(
    currentAuthor || currentTag || currentQ || currentFrom || currentTo,
  );

  const setParam = React.useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(next.toString() ? `${pathname}?${next}` : pathname);
    },
    [params, pathname, router],
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim());
          }}
          className="flex min-w-[220px] flex-1 items-center gap-2"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar en el texto…"
              aria-label="Buscar en las entradas"
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <Input
            type="date"
            value={currentFrom}
            onChange={(e) => setParam("from", e.target.value)}
            className="h-9 w-[150px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <Input
            type="date"
            value={currentTo}
            onChange={(e) => setParam("to", e.target.value)}
            className="h-9 w-[150px]"
          />
        </label>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(pathname)}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar
          </Button>
        )}
      </div>

      {authors.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Quién
          </span>
          {authors.map((a) => {
            const active = currentAuthor === a.email;
            return (
              <button
                key={a.email}
                type="button"
                onClick={() => setParam("author", active ? "" : a.email)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {a.name?.trim() || a.email.split("@")[0]}
              </button>
            );
          })}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Etiqueta
          </span>
          {tags.slice(0, 14).map((t) => {
            const active = currentTag === t.tag;
            return (
              <button
                key={t.tag}
                type="button"
                onClick={() => setParam("tag", active ? "" : t.tag)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tagLabel(t.tag)}
                <span className={cn("ml-1", active ? "opacity-70" : "opacity-50")}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
