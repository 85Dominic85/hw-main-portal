"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const TITLE_BY_PATH: Record<string, string> = {
  "/": "Resumen",
  "/mainops": "MainOPS",
  "/hwtool": "HW Tool",
  "/hsm": "HSM",
  "/admin": "Administración",
  "/lab/shields": "Lab · Shields",
};

function getTitle(pathname: string): string {
  if (TITLE_BY_PATH[pathname]) return TITLE_BY_PATH[pathname];
  // Match prefijos para sub-rutas (ej. /admin/notes)
  const prefix = Object.keys(TITLE_BY_PATH).find(
    (key) => key !== "/" && pathname.startsWith(`${key}/`),
  );
  return prefix ? TITLE_BY_PATH[prefix]! : "Portal";
}

/**
 * Topbar del portal.
 *
 * Contiene: título de la página actual + botón Actualizar + theme toggle + avatar.
 * Los atajos a herramientas externas (MOP/HWT/HSM) NO viven aquí — se renderizan
 * directamente sobre cada Shield para asociación visual inmediata.
 */
export function Topbar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-card px-4 lg:px-6">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Actualizar datos"
          className="gap-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
        <ThemeToggle />
        <div
          aria-label="Usuario"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
          title="Usuario"
        >
          QH
        </div>
      </div>
    </header>
  );
}
