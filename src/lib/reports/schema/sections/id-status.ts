import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

// ── I+D status WIP ───────────────────────────────────────────────────────────
// Estado del trabajo en curso de I+D. Texto rico libre.

export const idStatusSchema = z.object({
  doc: tiptapDocSchema.default(emptyTiptapDoc),
});

export type IdStatus = z.infer<typeof idStatusSchema>;
