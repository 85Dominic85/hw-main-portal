"use client";

import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export type SemStatus = "verde" | "amarillo" | "rojo" | "neutral";

// Orden fijo: verde · amarillo · rojo · neutral (última opción).
const ORDER: SemStatus[] = ["verde", "amarillo", "rojo", "neutral"];

// Mismos colores que el viewer/PDF, para coherencia visual.
const COLOR: Record<SemStatus, string> = {
  verde: "#4d9e63",
  amarillo: "#d9a93e",
  rojo: "#e0584e",
  neutral: "",
};

const LABEL: Record<SemStatus, string> = {
  verde: "Verde",
  amarillo: "Amarillo",
  rojo: "Rojo",
  neutral: "Neutral",
};

function Dot({ status, size = 16 }: { status: SemStatus; size?: number }) {
  if (status === "neutral") {
    return (
      <span
        className="inline-block shrink-0 rounded-full border-2 border-muted-foreground/40"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: COLOR[status] }}
    />
  );
}

interface StatusSelectProps {
  value: SemStatus;
  onChange: (status: SemStatus) => void;
}

/**
 * Selector de semáforo: solo puntos de color (sin el nombre del color),
 * orden verde → amarillo → rojo → neutral. El trigger muestra el punto actual.
 */
export function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Semáforo: ${LABEL[value]}`}
          aria-label={`Semáforo: ${LABEL[value]}`}
          className="flex items-center gap-1 rounded-sm px-1.5 py-1 transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <Dot status={value} size={15} />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-0 p-1">
        {ORDER.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => onChange(s)}
            title={LABEL[s]}
            className={cn("justify-center px-3 py-1.5", s === value && "bg-accent")}
          >
            <Dot status={s} size={18} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
