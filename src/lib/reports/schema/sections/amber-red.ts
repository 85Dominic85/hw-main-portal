import { z } from "zod";

export const amberRedRowSchema = z.object({
  id: z.string(),
  kpi: z.string().default(""),
  rootCause: z.string().default(""),
  action: z.string().default(""),
  eta: z.string().default(""), // fecha libre (p.ej. "2026-06-20")
  escalation: z.string().default(""),
  status: z.enum(["amarillo", "rojo"]).default("amarillo"),
});

export const amberRedSchema = z.object({
  rows: z.array(amberRedRowSchema).default([]),
});

export type AmberRedRow = z.infer<typeof amberRedRowSchema>;
export type AmberRed = z.infer<typeof amberRedSchema>;
