"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

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
  const prefix = Object.keys(TITLE_BY_PATH).find(
    (key) => key !== "/" && pathname.startsWith(`${key}/`),
  );
  return prefix ? TITLE_BY_PATH[prefix]! : "Portal";
}

interface TopbarProps {
  user: {
    email: string;
    fullName: string | null;
    role: "admin" | "viewer";
  };
  /** Si true, el portal está en modo abierto (sin auth real). El UserMenu
   *  muestra un badge "demo" y el botón cerrar sesión queda deshabilitado. */
  openMode?: boolean;
}

/**
 * Topbar del portal — título de la sección + utilidades del usuario.
 * Recibe el `user` como prop desde el layout (Server Component) para no
 * tener que volver a leer la sesión en cliente.
 */
export function Topbar({ user, openMode = false }: TopbarProps) {
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
        <UserMenu
          email={user.email}
          fullName={user.fullName}
          role={user.role}
          openMode={openMode}
        />
      </div>
    </header>
  );
}
