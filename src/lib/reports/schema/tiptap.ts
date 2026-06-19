import { z } from "zod";

const tiptapMarkSchema: z.ZodTypeAny = z.object({
  type: z.string(),
  attrs: z.record(z.unknown()).optional(),
});

const tiptapNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.unknown()).optional(),
    marks: z.array(tiptapMarkSchema).optional(),
    text: z.string().optional(),
    content: z.array(tiptapNodeSchema).optional(),
  }),
);

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(tiptapNodeSchema).default([]),
});

export type TiptapDoc = z.infer<typeof tiptapDocSchema>;

export const emptyTiptapDoc = (): TiptapDoc => ({ type: "doc", content: [] });
