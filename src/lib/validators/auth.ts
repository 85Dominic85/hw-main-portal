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

/** Email @dominio permitido (reutilizable). */
const allowlistEmail = z
  .string()
  .trim()
  .min(1, "El email es obligatorio")
  .email("El email no es válido")
  .transform((v) => v.toLowerCase())
  .refine(
    (email) => email.endsWith(`@${ALLOWLIST_DOMAIN}`),
    `Solo se permiten correos @${ALLOWLIST_DOMAIN}`,
  );

/** Solicitud de enlace de restablecimiento. */
export const requestResetSchema = z.object({
  email: allowlistEmail,
});

export type RequestResetInput = z.infer<typeof requestResetSchema>;

/** Envío del formulario de nueva contraseña (con token del email). */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Falta el token."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirm: z.string().min(1, "Confirma la contraseña."),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
