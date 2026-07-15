import { z } from "zod";
import { tesisSchema } from "./sections/tesis";
import { executiveSummarySchema } from "./sections/executive-summary";
import { amberRedSchema } from "./sections/amber-red";
import { memberSectionSchema } from "./sections/member";
import { performanceSchema } from "./sections/performance";
import { idStatusSchema } from "./sections/id-status";
import { nextFocusSchema } from "./sections/next-focus";

export const REPORT_CURRENT_VERSION = 1 as const;

export const reportContentSchemaV1 = z.object({
  _version: z.literal(1).default(1),
  // Autor del informe (mostrado en la cabecera de propiedades, estilo Notion).
  author: z.string().default(""),
  tesis: tesisSchema.default({}),
  executiveSummary: executiveSummarySchema.default({}),
  amberRed: amberRedSchema.default({}),
  // Secciones por persona (esqueleto v3: KPIs personales + Highlights + Bloqueos)
  marco: memberSectionSchema.default({}),
  domingo: memberSectionSchema.default({}),
  guillermo: memberSectionSchema.default({}),
  // Performance del equipo (solo jj.gallego)
  performance: performanceSchema.default({}),
  // I+D status WIP
  idStatus: idStatusSchema.default({}),
  // Foco del mes / semana (reusa la tabla de nextFocus)
  nextFocus: nextFocusSchema.default({}),
});

export type ReportContentV1 = z.infer<typeof reportContentSchemaV1>;
export type ReportContent = ReportContentV1;

// Re-exports for convenience
export type { Tesis } from "./sections/tesis";
export type { ExecutiveSummary, ExecutiveSummaryRow } from "./sections/executive-summary";
export type { AmberRed, AmberRedRow } from "./sections/amber-red";
export type { Highlights } from "./sections/highlights";
export type { Blockers, BlockerRow } from "./sections/blockers";
export type { MemberSection, PersonalKpiRow } from "./sections/member";
export type { Performance, MemberBlock } from "./sections/performance";
export type { IdStatus } from "./sections/id-status";
export type { NextFocus, NextFocusRow } from "./sections/next-focus";
export type { KpiSnapshot, KpiSnapshotEntry, SourceHealth } from "./kpi-snapshot";
export { kpiSnapshotSchema } from "./kpi-snapshot";
export { tiptapDocSchema } from "./tiptap";
export type { TiptapDoc } from "./tiptap";
