import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

export const pabloCommentsSchema = z.object({
  doc: tiptapDocSchema.default(emptyTiptapDoc),
});

export type PabloComments = z.infer<typeof pabloCommentsSchema>;
