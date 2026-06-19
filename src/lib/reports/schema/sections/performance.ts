import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

const memberKpiRowSchema = z.object({
  id: z.string(),
  label: z.string().default(""),
  value: z.string().default(""),
  target: z.string().default(""),
  status: z.enum(["verde", "amarillo", "rojo", "neutral"]).default("neutral"),
});

const memberBlockSchema = z.object({
  member: z.string(), // "guille" | "domi" | "marco" | "jj"
  displayName: z.string(),
  kpis: z.array(memberKpiRowSchema).default([]),
  narrative: tiptapDocSchema.default(emptyTiptapDoc),
});

export const performanceSchema = z.object({
  members: z
    .array(memberBlockSchema)
    .default([
      { member: "guille", displayName: "Guille", kpis: [], narrative: { type: "doc", content: [] } },
      { member: "domi",   displayName: "Domi",   kpis: [], narrative: { type: "doc", content: [] } },
      { member: "marco",  displayName: "Marco",  kpis: [], narrative: { type: "doc", content: [] } },
      { member: "jj",     displayName: "JJ",     kpis: [], narrative: { type: "doc", content: [] } },
    ]),
});

export type MemberBlock = z.infer<typeof memberBlockSchema>;
export type MemberKpiRow = z.infer<typeof memberKpiRowSchema>;
export type Performance = z.infer<typeof performanceSchema>;
