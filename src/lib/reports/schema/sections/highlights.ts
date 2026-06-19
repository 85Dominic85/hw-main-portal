import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

export const highlightsSchema = z.object({
  doc: tiptapDocSchema.default(emptyTiptapDoc),
});

export type Highlights = z.infer<typeof highlightsSchema>;
