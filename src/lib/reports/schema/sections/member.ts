import { z } from "zod";
import { highlightsSchema } from "./highlights";
import { blockersSchema } from "./blockers";

// ── Sección por persona (Marco / Domingo / Guillermo) ────────────────────────
// Esqueleto v3: KPIs personales + Highlights + Bloqueos.
// Los sub-bloques P1/P2/P3 (Cajones, RMA, Contabilidad…) se añaden después.

export const personalKpiRowSchema = z.object({
  id: z.string(),
  label: z.string().default(""),
  value: z.string().default(""),
  target: z.string().default(""),
  status: z.enum(["verde", "amarillo", "rojo", "neutral"]).default("neutral"),
});

export const memberSectionSchema = z.object({
  kpisPersonales: z.array(personalKpiRowSchema).default([]),
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
});

export type PersonalKpiRow = z.infer<typeof personalKpiRowSchema>;
export type MemberSection = z.infer<typeof memberSectionSchema>;
