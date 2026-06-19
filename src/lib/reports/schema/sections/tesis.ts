import { z } from "zod";
import { tiptapDocSchema, emptyTiptapDoc } from "../tiptap";

export const tesisSchema = z.object({
  doc: tiptapDocSchema.default(emptyTiptapDoc),
});

export type Tesis = z.infer<typeof tesisSchema>;
