import { z } from "zod";

export const blockerRowSchema = z.object({
  id: z.string(),
  description: z.string().default(""),
  owner: z.string().default(""),
  impact: z.string().default(""),
  status: z.enum(["abierto", "en_progreso", "bloqueado"]).default("abierto"),
});

export const blockersSchema = z.object({
  rows: z.array(blockerRowSchema).default([]),
});

export type BlockerRow = z.infer<typeof blockerRowSchema>;
export type Blockers = z.infer<typeof blockersSchema>;
