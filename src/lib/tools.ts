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
    displayName: "Logística",
    externalUrl: "https://hw-sell-gear-platform-tsm1.vercel.app/orders",
    internalPath: "/mainops",
    heroLabel: "% envíos OK",
    enabledInV1: true,
  },
  {
    id: "hwtool",
    shortLabel: "HWT",
    displayName: "Configuraciones",
    externalUrl: "https://hwtoolbox.lovable.app/",
    internalPath: "/hwtool",
    heroLabel: "% configs OK a 1ª",
    enabledInV1: true,
  },
  {
    id: "hsm",
    shortLabel: "HSM",
    displayName: "Hardware Support Manager",
    externalUrl: "https://hardware-support-manager.vercel.app/dashboard",
    internalPath: "/hsm",
    heroLabel: "% SLA cumplido",
    enabledInV1: true,
  },
] as const;

export function getTool(id: ToolId): Tool {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Tool desconocida: ${id}`);
  return tool;
}
