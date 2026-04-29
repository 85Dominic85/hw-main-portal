"use client";

import * as React from "react";
import { LogOut, ShieldCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/server/actions/auth";
import { cn } from "@/lib/utils/cn";

interface UserMenuProps {
  email: string;
  fullName: string | null;
  role: "admin" | "viewer";
  /** Si true, el portal está en modo abierto (sin auth real). El badge
   *  "demo" aparece junto al rol y el botón cerrar sesión se deshabilita. */
  openMode?: boolean;
}

function getInitials(email: string, fullName: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.charAt(0) ?? "";
      const last = parts[parts.length - 1]?.charAt(0) ?? "";
      return (first + last).toUpperCase() || "U";
    }
    if (parts.length === 1) {
      return (parts[0] ?? "").slice(0, 2).toUpperCase() || "U";
    }
  }
  // Fallback: primeras dos letras del email antes de la @
  const local = email.split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "U";
}

export function UserMenu({ email, fullName, role, openMode = false }: UserMenuProps) {
  const [isPending, startTransition] = React.useTransition();
  const initials = getInitials(email, fullName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground",
          "transition-all hover:bg-secondary/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        aria-label="Menú de usuario"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          {fullName && <span className="font-semibold">{fullName}</span>}
          <span className="truncate text-xs text-muted-foreground" title={email}>
            {email}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="inline-flex w-fit items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {role}
            </span>
            {openMode && (
              <span
                className="inline-flex w-fit items-center rounded bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                title="Portal abierto — sin autenticación real"
              >
                demo
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {openMode ? (
          <DropdownMenuItem
            disabled
            className="cursor-not-allowed text-muted-foreground"
            title="Portal abierto — no hay sesión que cerrar"
          >
            <LogOut className="h-4 w-4 opacity-50" aria-hidden="true" />
            Portal abierto
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={isPending}
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await signOut();
              });
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
