/**
 * Catálogo central de las herramientas externas del dpto Hardware.
 * El topbar y los escudos de la home leen de aquí.
 *
 * `externalUrl` apunta al despliegue real de cada herramienta. En v0
 * son placeholders — actualizar cuando tengamos los dominios definitivos.
 */

export type ToolId = "mainops" | "hwtool" | "hsm";

export interface Tool {
  id: ToolId;
  shortLabel: string;          // texto del botón del topbar (3 letras)
  displayName: string;         // nombre completo
  externalUrl: string;         // URL real para abrir la herramienta
  internalPath: `/${string}`;  // ruta interna del portal (pestaña detalle)
  heroLabel: string;           // qué representa el % del escudo
  enabledInV1: boolean;        // false → escudo en estado "próximamente"
}

export const TOOLS: readonly Tool[] = [
  {
    id: "mainops",
    shortLabel: "MOP",
    displayName: "MainOPS",
    externalUrl: "https://mainops.qamarero.com",
    internalPath: "/mainops",
    heroLabel: "% envíos OK",
    enabledInV1: true,
  },
  {
    id: "hwtool",
    shortLabel: "HWT",
    displayName: "HW Tool",
    externalUrl: "https://hwtool.qamarero.com",
    internalPath: "/hwtool",
    heroLabel: "% plug-n-play",
    enabledInV1: true,
  },
  {
    id: "hsm",
    shortLabel: "HSM",
    displayName: "Hardware Support Manager",
    externalUrl: "https://hsm.qamarero.com",
    internalPath: "/hsm",
    heroLabel: "% SLA cumplido",
    enabledInV1: false,
  },
] as const;

export function getTool(id: ToolId): Tool {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Tool desconocida: ${id}`);
  return tool;
}
