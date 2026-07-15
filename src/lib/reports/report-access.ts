/**
 * Control de visibilidad de secciones del informe por email.
 * Módulo puro (sin server-only) → usable en cliente y servidor.
 */

/** La tabla de Performance del equipo solo la ve/edita JJ. */
export const PERFORMANCE_ALLOWED_EMAIL = "jj.gallego@qamarero.com";

/** True si el email puede ver/desplegar la sección de Performance. */
export function canSeePerformance(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === PERFORMANCE_ALLOWED_EMAIL;
}
