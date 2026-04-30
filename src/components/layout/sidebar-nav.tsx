"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Settings2, LifeBuoy, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  /** Solo visible para el rol especificado (si se omite, lo ven todos). */
  requiresRole?: "admin";
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Inicio", icon: Home, enabled: true },
  { href: "/mainops", label: "Logística", icon: Package, enabled: true },
  { href: "/hwtool", label: "Configuraciones", icon: Settings2, enabled: true },
  { href: "/hsm", label: "HSM", icon: LifeBuoy, enabled: false },
  { href: "/admin", label: "Admin", icon: ShieldCheck, enabled: true, requiresRole: "admin" },
] as const;

interface SidebarNavProps {
  role: "admin" | "viewer";
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => !item.requiresRole || item.requiresRole === role,
  );

  return (
    <aside
      aria-label="Navegación principal"
      className="flex h-full w-16 flex-col items-center gap-1 border-r border-border/60 bg-card py-4 lg:w-56 lg:items-stretch lg:px-3"
    >
      <Link
        href="/"
        className="mb-4 flex h-10 items-center justify-center rounded-md font-mono text-lg font-bold tracking-tighter lg:justify-start lg:px-3"
      >
        <span className="text-primary lg:hidden">Q</span>
        <span className="hidden lg:inline">Qamarero / HW</span>
      </Link>

      <nav className="flex w-full flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-disabled={!item.enabled}
              tabIndex={item.enabled ? 0 : -1}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                !item.enabled && "pointer-events-none opacity-40",
              )}
              onClick={(e) => {
                if (!item.enabled) e.preventDefault();
              }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">{item.label}</span>
              {!item.enabled && (
                <span className="ml-auto hidden rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground lg:inline">
                  v2
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
