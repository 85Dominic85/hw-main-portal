import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

// ── Performance del equipo (solo visible para jj.gallego) ────────────────────
// Tabla fija: Guillermo, Domingo, Marco. Una columna de texto enriquecido.

const memberBlockSchema = z.object({
  member: z.string(), // "guille" | "domi" | "marco"
  displayName: z.string(),
  narrative: tiptapDocSchema.default(emptyTiptapDoc),
});

export const performanceSchema = z.object({
  members: z
    .array(memberBlockSchema)
    .default([
      { member: "guille", displayName: "Guillermo", narrative: { type: "doc", content: [] } },
      { member: "domi",   displayName: "Domingo",   narrative: { type: "doc", content: [] } },
      { member: "marco",  displayName: "Marco",     narrative: { type: "doc", content: [] } },
    ]),
});

export type MemberBlock = z.infer<typeof memberBlockSchema>;
export type Performance = z.infer<typeof performanceSchema>;
