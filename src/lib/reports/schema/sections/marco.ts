import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";
import { highlightsSchema } from "./highlights";
import { blockersSchema } from "./blockers";

// ── Marco Informe (owner: Marco) ─────────────────────────────────────────────
// Aportación propia de Marco al informe: highlights, bloqueos y narrativa libre.

export const marcoInformeSchema = z.object({
  highlights: highlightsSchema.default({}),
  blockers: blockersSchema.default({}),
  narrative: tiptapDocSchema.default(emptyTiptapDoc),
});

export type MarcoInforme = z.infer<typeof marcoInformeSchema>;
