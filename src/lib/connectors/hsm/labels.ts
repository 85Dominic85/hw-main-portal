import type { HsmAgingBucket, HsmIncidentPriority } from "./types";

export const PRIORITY_LABELS: Record<HsmIncidentPriority, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/**
 * Colores HSL para charts. Mantienen coherencia con la escala usada en
 * MainOps/HW Tool (azul → ámbar → rojo según severidad).
 */
export const PRIORITY_COLORS: Record<HsmIncidentPriority, string> = {
  critica: "hsl(0 84% 60%)",   // rojo
  alta:    "hsl(38 92% 50%)",  // ámbar
  media:   "hsl(217 91% 60%)", // azul
  baja:    "hsl(215 16% 47%)", // gris
};

export function labelForPriority(p: string): string {
  return (PRIORITY_LABELS as Record<string, string>)[p] ?? p;
}

export function colorForPriority(p: string): string {
  return (PRIORITY_COLORS as Record<string, string>)[p] ?? "hsl(215 16% 47%)";
}

export const AGING_LABELS: Record<HsmAgingBucket, string> = {
  lt_1d: "<1 día",
  "1_3d": "1-3 días",
  "3_7d": "3-7 días",
  gt_7d: ">7 días",
};

export function labelForAging(b: string): string {
  return (AGING_LABELS as Record<string, string>)[b] ?? b;
}

/** Color del aging — más oscuro a más viejo (sugiere urgencia). */
export const AGING_COLORS: Record<HsmAgingBucket, string> = {
  lt_1d: "hsl(152 76% 36%)", // verde
  "1_3d": "hsl(217 91% 60%)", // azul
  "3_7d": "hsl(38 92% 50%)",  // ámbar
  gt_7d: "hsl(0 84% 60%)",    // rojo
};

export function colorForAging(b: string): string {
  return (AGING_COLORS as Record<string, string>)[b] ?? "hsl(215 16% 47%)";
}
