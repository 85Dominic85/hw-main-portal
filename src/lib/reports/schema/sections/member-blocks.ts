import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

// ── Sub-bloques específicos de cada miembro (P2 / P3) ─────────────────────────
// El P1 (Herramientas I+D) es común y vive en `rnd-tools.ts`.

// Guillermo · P2 Contabilidad
export const contabilidadSchema = z.object({
  vencimientos: z.string().default(""),
  facturas: z.string().default(""),
  reinversion: z.string().default(""),
});
export type Contabilidad = z.infer<typeof contabilidadSchema>;

// Guillermo · P3 AM Experience
export const amExperienceSchema = z.object({
  incidencias: z.string().default(""),
  mejoras: z.string().default(""),
});
export type AmExperience = z.infer<typeof amExperienceSchema>;

// Domingo · P2 RMA y Proveedores — casos con estado y SLA de respuesta del dpto.
export const rmaCaseStatus = z.enum([
  "abierto",
  "en_progreso",
  "esperando_proveedor",
  "escalada",
  "cerrada",
]);
export const rmaCaseSchema = z.object({
  id: z.string(),
  caso: z.string().default(""),
  estado: rmaCaseStatus.default("abierto"),
  sla: z.string().default(""),
});
export const rmaSchema = z.object({
  casos: z.array(rmaCaseSchema).default([]),
});
export type RmaCaseStatus = z.infer<typeof rmaCaseStatus>;
export type RmaCase = z.infer<typeof rmaCaseSchema>;
export type Rma = z.infer<typeof rmaSchema>;

// Domingo · P3 KDS
export const kdsSchema = z.object({
  nuevosClientes: z.string().default(""),
  cambiosUso: z.string().default(""),
  pendientes: z.string().default(""),
});
export type Kds = z.infer<typeof kdsSchema>;

// Marco · Cajones — métricas de la semana.
export const cajonesSchema = z.object({
  clientesNuevos: z.string().default(""),
  activados: z.string().default(""),
  pendientes: z.string().default(""),
  mrrNuevo: z.string().default(""),
});
export type Cajones = z.infer<typeof cajonesSchema>;

// Marco · Q Experience — caja de texto libre (rich text).
export const qExperienceSchema = z.object({
  doc: tiptapDocSchema.default(emptyTiptapDoc),
});
export type QExperience = z.infer<typeof qExperienceSchema>;
