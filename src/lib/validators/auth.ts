import { z } from "zod";

const ALLOWLIST_DOMAIN = (
  process.env.PORTAL_EMAIL_ALLOWLIST_DOMAIN ?? "qamarero.com"
).toLowerCase();

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El email es obligatorio")
    .email("El email no es válido")
    .transform((v) => v.toLowerCase())
    .refine(
      (email) => email.endsWith(`@${ALLOWLIST_DOMAIN}`),
      `Solo se permiten correos @${ALLOWLIST_DOMAIN}`,
    ),
  next: z
    .string()
    .startsWith("/", "Ruta inválida")
    .max(200)
    .optional()
    .default("/"),
});

export type SignInInput = z.infer<typeof signInSchema>;
