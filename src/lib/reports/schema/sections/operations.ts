import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";
import { highlightsSchema } from "./highlights";
import { blockersSchema } from "./blockers";

// ── Activaciones (Configuraciones) (owner: Guille) ───────────────────────────

export const configTechBreakdownRowSchema = z.object({
  id: z.string(),
  technician: z.string().default(""),
  count: z.number().int().nonnegative().nullable().default(null),
  avgMinutes: z.number().nonnegative().nullable().default(null),
  successRate: z.number().nonnegative().nullable().default(null),
});

export const configuracionesSchema = z.object({
  // Auto-poblado desde HW Tool (read-only en editor)
  totalConfigs: z.number().int().nonnegative().nullable().default(null),
  successRate1st: z.number().nonnegative().nullable().default(null),
  successRate2nd: z.number().nonnegative().nullable().default(null),
  // Manual v1 (auto en v2 tras ampliar endpoint)
  techBreakdown: z.array(configTechBreakdownRowSchema).default([]),
  problems: z.string().default(""),
  // Aportación del encargado del área
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
});

// ── Envíos y Logística (owner: Domi) ─────────────────────────────────────────

export const enviosOrderRowSchema = z.object({
  id: z.string(),
  venue: z.string().default(""),
  status: z.enum(["completado", "enviado", "pendiente", "bloqueado"]).default("pendiente"),
  notes: z.string().default(""),
});

export const enviosSchema = z.object({
  // Auto-poblado desde MainOPS
  totalOps: z.number().int().nonnegative().nullable().default(null),
  completed: z.number().int().nonnegative().nullable().default(null),
  shipped: z.number().int().nonnegative().nullable().default(null),
  pending: z.number().int().nonnegative().nullable().default(null),
  avgDeliveryDays: z.number().nonnegative().nullable().default(null),
  sla7dPct: z.number().nonnegative().nullable().default(null),
  // Manual v1 — las cantidades monetarias van a la futura sección Finanzas
  coveragePnp: z.string().default(""),
  officeVsProvider: z.string().default(""),
  orders: z.array(enviosOrderRowSchema).default([]),
  // Aportación del encargado del área
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
});

// ── Soporte HW (owner: Domi) ─────────────────────────────────────────────────

export const rmaRowSchema = z.object({
  id: z.string(),
  provider: z.string().default(""),
  device: z.string().default(""),
  status: z.string().default(""),
  daysOpen: z.number().int().nonnegative().nullable().default(null),
  notes: z.string().default(""),
});

// Incidencia destacada de la semana (manual): algo relevante que contar de un caso.
export const incidentHighlightRowSchema = z.object({
  id: z.string(),
  customer: z.string().default(""),
  priority: z.enum(["critica", "alta", "media", "baja"]).default("media"),
  status: z.string().default(""),
  daysOpen: z.number().int().nonnegative().nullable().default(null),
  comment: z.string().default(""),
});

export const soporteSchema = z.object({
  // Auto-poblado desde HSM
  openIncidents: z.number().int().nonnegative().nullable().default(null),
  incidentsOver7d: z.number().int().nonnegative().nullable().default(null),
  activeRmas: z.number().int().nonnegative().nullable().default(null),
  sla7dPct: z.number().nonnegative().nullable().default(null),
  criticalInSlaPct: z.number().nonnegative().nullable().default(null),
  reopenRatePct: z.number().nonnegative().nullable().default(null),
  avgResolutionHours: z.number().nonnegative().nullable().default(null),
  avgRmaTurnaroundDays: z.number().nonnegative().nullable().default(null),
  // Manual v1
  rmaResponseUnder2hPct: z.number().nonnegative().nullable().default(null),
  incidents: z.array(incidentHighlightRowSchema).default([]),
  rmas: z.array(rmaRowSchema).default([]),
  narrative: tiptapDocSchema.default(emptyTiptapDoc),
  // Aportación del encargado del área
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
});

// ── Cajones inteligentes (owner: JJ) ─────────────────────────────────────────

export const cajonRowSchema = z.object({
  id: z.string(),
  client: z.string().default(""),
  status: z.string().default(""),
  provider: z.string().default(""),
  notes: z.string().default(""),
  mrr: z.number().nonnegative().nullable().default(null),
});

export const cajonesSchema = z.object({
  rows: z.array(cajonRowSchema).default([]),
  // Aportación del encargado del área
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
});

export type Configuraciones = z.infer<typeof configuracionesSchema>;
export type ConfigTechBreakdownRow = z.infer<typeof configTechBreakdownRowSchema>;
export type Envios = z.infer<typeof enviosSchema>;
export type EnviosOrderRow = z.infer<typeof enviosOrderRowSchema>;
export type Soporte = z.infer<typeof soporteSchema>;
export type RmaRow = z.infer<typeof rmaRowSchema>;
export type IncidentHighlightRow = z.infer<typeof incidentHighlightRowSchema>;
export type Cajones = z.infer<typeof cajonesSchema>;
export type CajonRow = z.infer<typeof cajonRowSchema>;
