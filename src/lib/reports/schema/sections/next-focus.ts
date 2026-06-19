import { z } from "zod";

export const nextFocusRowSchema = z.object({
  id: z.string(),
  owner: z.string().default(""),
  objective: z.string().default(""),
  output: z.string().default(""),
  priority: z.enum(["alta", "media", "baja"]).default("media"),
});

export const nextFocusSchema = z.object({
  rows: z.array(nextFocusRowSchema).default([]),
});

export type NextFocusRow = z.infer<typeof nextFocusRowSchema>;
export type NextFocus = z.infer<typeof nextFocusSchema>;
