import { z } from "zod";

export const decisionRowSchema = z.object({
  id: z.string(),
  description: z.string().default(""),
  owner: z.string().default(""),
  deadline: z.string().default(""),
  status: z.enum(["pendiente", "cerrada", "escalada"]).default("pendiente"),
  resolution: z.string().default(""),
});

export const decisionsSchema = z.object({
  rows: z.array(decisionRowSchema).default([]),
});

export type DecisionRow = z.infer<typeof decisionRowSchema>;
export type Decisions = z.infer<typeof decisionsSchema>;
