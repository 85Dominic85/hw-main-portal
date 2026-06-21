import { z } from "zod";
import { tesisSchema } from "./sections/tesis";
import { executiveSummarySchema } from "./sections/executive-summary";
import { amberRedSchema } from "./sections/amber-red";
import { highlightsSchema } from "./sections/highlights";
import { blockersSchema } from "./sections/blockers";
import { decisionsSchema } from "./sections/decisions";
import {
  configuracionesSchema,
  enviosSchema,
  soporteSchema,
  cajonesSchema,
} from "./sections/operations";
import { performanceSchema } from "./sections/performance";
import { nextFocusSchema } from "./sections/next-focus";
import { pabloCommentsSchema } from "./sections/pablo-comments";

export const REPORT_CURRENT_VERSION = 1 as const;

export const reportContentSchemaV1 = z.object({
  _version: z.literal(1).default(1),
  // Autor del informe (mostrado en la cabecera de propiedades, estilo Notion).
  // Autollenado con el admin que crea el informe; editable a mano.
  author: z.string().default(""),
  tesis: tesisSchema.default({}),
  executiveSummary: executiveSummarySchema.default({}),
  amberRed: amberRedSchema.default({}),
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
  decisions: decisionsSchema.default({}),
  configuraciones: configuracionesSchema.default({}),
  envios: enviosSchema.default({}),
  soporte: soporteSchema.default({}),
  cajones: cajonesSchema.default({}),
  performance: performanceSchema.default({}),
  nextFocus: nextFocusSchema.default({}),
  pabloComments: pabloCommentsSchema.default({}),
});

export type ReportContentV1 = z.infer<typeof reportContentSchemaV1>;
export type ReportContent = ReportContentV1;

// Re-exports for convenience
export type { Tesis } from "./sections/tesis";
export type { ExecutiveSummary, ExecutiveSummaryRow } from "./sections/executive-summary";
export type { AmberRed, AmberRedRow } from "./sections/amber-red";
export type { Highlights } from "./sections/highlights";
export type { Blockers, BlockerRow } from "./sections/blockers";
export type { Decisions, DecisionRow } from "./sections/decisions";
export type {
  Configuraciones,
  ConfigTechBreakdownRow,
  Envios,
  EnviosOrderRow,
  Soporte,
  RmaRow,
  Cajones,
  CajonRow,
} from "./sections/operations";
export type { Performance, MemberBlock, MemberKpiRow } from "./sections/performance";
export type { NextFocus, NextFocusRow } from "./sections/next-focus";
export type { PabloComments } from "./sections/pablo-comments";
export type { KpiSnapshot, KpiSnapshotEntry, SourceHealth } from "./kpi-snapshot";
export { kpiSnapshotSchema } from "./kpi-snapshot";
export { tiptapDocSchema } from "./tiptap";
export type { TiptapDoc } from "./tiptap";
