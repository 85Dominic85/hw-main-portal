/**
 * Control de visibilidad de secciones del informe por email.
 * Módulo puro (sin server-only) → usable en cliente y servidor.
 */

/** La tabla de Performance del equipo solo la ve/edita JJ. */
export const PERFORMANCE_ALLOWED_EMAIL = "jj.gallego@qamarero.com";

/**
 * Emails que, además de JJ, reciben Performance SOLO en el PDF descargado
 * (no en pantalla ni en los exports Markdown/Notion). Domingo lo necesita para
 * enviar el informe al CEO; confirmado el 2026-10-29.
 */
export const PERFORMANCE_PDF_EXTRA_EMAILS: readonly string[] = ["domingo.bueno@qamarero.com"];

function normalize(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** True si el email puede ver/desplegar la sección de Performance. */
export function canSeePerformance(email: string | null | undefined): boolean {
  return normalize(email) === PERFORMANCE_ALLOWED_EMAIL;
}

/** True si el PDF descargado por este email debe incluir Performance. */
export function canExportPerformancePdf(email: string | null | undefined): boolean {
  return canSeePerformance(email) || PERFORMANCE_PDF_EXTRA_EMAILS.includes(normalize(email));
}
