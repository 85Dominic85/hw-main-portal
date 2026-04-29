/**
 * Mapping de claves canónicas de la API HW Tool a etiquetas en español.
 * Si la API añade claves nuevas que no están aquí, el mapper las muestra
 * con la clave tal cual (string raw) para no perder datos.
 */

export const PROBLEM_LABELS: Record<string, string> = {
  no_problem: "Sin problemas",
  preparacion_cliente: "Preparación del cliente",
  hardware_problem: "Problema de hardware",
  network_problem: "Problema de red",
  other_problem: "Otros problemas",
  nivel_tech_cliente: "Nivel técnico del cliente",
};

export function labelForProblem(key: string): string {
  return PROBLEM_LABELS[key] ?? key.replace(/_/g, " ");
}

/**
 * Color asociado a cada categoría de problema (para los pie charts).
 * Usa los tokens semánticos de la paleta cuando aplica.
 */
export const PROBLEM_COLORS: Record<string, string> = {
  no_problem: "hsl(var(--status-ok))",
  preparacion_cliente: "hsl(220 70% 60%)", // azul
  hardware_problem: "hsl(280 70% 60%)", // morado
  network_problem: "hsl(var(--status-warn))",
  other_problem: "hsl(195 70% 55%)", // cian
  nivel_tech_cliente: "hsl(var(--status-danger))",
};

export function colorForProblem(key: string): string {
  return PROBLEM_COLORS[key] ?? "hsl(var(--muted-foreground))";
}
