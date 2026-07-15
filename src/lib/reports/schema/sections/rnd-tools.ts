import { z } from "zod";

// ── P1 · Herramientas I+D (común a Marco / Domingo / Guillermo) ───────────────
// Por cada herramienta de la que el miembro es owner: qué se ha hecho esta
// semana (actualizaciones, mejoras, añadidos…).

export const rndToolSchema = z.object({
  id: z.string(),
  tool: z.string().default(""),
  detail: z.string().default(""),
});

export const rndToolsSchema = z.object({
  items: z.array(rndToolSchema).default([]),
});

export type RndTool = z.infer<typeof rndToolSchema>;
export type RndTools = z.infer<typeof rndToolsSchema>;
