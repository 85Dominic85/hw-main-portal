import { z } from "zod";
import { highlightsSchema } from "./highlights";
import { blockersSchema } from "./blockers";
import { rndToolsSchema } from "./rnd-tools";
import {
  contabilidadSchema,
  amExperienceSchema,
  rmaSchema,
  kdsSchema,
  cajonesSchema,
  qExperienceSchema,
} from "./member-blocks";

// ── Secciones por persona (Guillermo / Domingo / Marco) ──────────────────────
// Orden lógico de render dentro de cada miembro:
//   KPIs personales → P1 Herramientas I+D → P2/P3 propios → Highlights → Bloqueos
// El P1 (Herramientas I+D) es común a los tres; P2/P3 son específicos.

export const personalKpiRowSchema = z.object({
  id: z.string(),
  label: z.string().default(""),
  value: z.string().default(""),
  target: z.string().default(""),
  status: z.enum(["verde", "amarillo", "rojo", "neutral"]).default("neutral"),
});
export type PersonalKpiRow = z.infer<typeof personalKpiRowSchema>;

/** Campos comunes a los tres miembros. */
const commonMemberFields = {
  kpisPersonales: z.array(personalKpiRowSchema).default([]),
  toolsRnd: rndToolsSchema.default({}), // P1 (común)
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
};

export const guillermoSectionSchema = z.object({
  ...commonMemberFields,
  contabilidad: contabilidadSchema.default({}), // P2
  amExperience: amExperienceSchema.default({}), // P3
});

export const domingoSectionSchema = z.object({
  ...commonMemberFields,
  rma: rmaSchema.default({}), // P2
  kds: kdsSchema.default({}), // P3
});

export const marcoSectionSchema = z.object({
  ...commonMemberFields,
  cajones: cajonesSchema.default({}), // Cajones
  qExperience: qExperienceSchema.default({}), // Q Experience
});

export type GuillermoSection = z.infer<typeof guillermoSectionSchema>;
export type DomingoSection = z.infer<typeof domingoSectionSchema>;
export type MarcoSection = z.infer<typeof marcoSectionSchema>;

/** Campos comunes (para tipar componentes que solo tocan la parte compartida). */
export type MemberCommon = Pick<
  GuillermoSection,
  "kpisPersonales" | "toolsRnd" | "highlights" | "blockers"
>;
