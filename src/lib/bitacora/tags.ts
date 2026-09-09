/**
 * Etiquetas de la bitácora.
 *
 * Las etiquetas son OPCIONALES y libres: se puede escribir cualquiera.
 * El catálogo de abajo son solo *sugerencias* que la UI ofrece como chips,
 * para que la agregación del recopilatorio semanal funcione de verdad sin
 * convertir la captura en un formulario rígido.
 *
 * Módulo neutro (sin dependencias de servidor) — importable desde
 * componentes cliente y desde server actions.
 */

/**
 * Etiquetas sugeridas, en el orden en que se ofrecen en la UI.
 * Añadir aquí una nueva la propone en el composer; no hace falta migración
 * porque `tags` es un `text[]` libre.
 */
export const SUGGESTED_TAGS = [
  "llamada",
  "incidencia",
  "configuracion",
  "instalacion",
  "visita",
  "rma",
  "kds",
  "cajones",
  "tpv",
  "comandera",
  "stock",
  "seguimiento",
] as const;

export type SuggestedTag = (typeof SUGGESTED_TAGS)[number];

/** Máximo de etiquetas por entrada — evita que una entrada se convierta en un índice. */
export const MAX_TAGS_PER_ENTRY = 8;

/** Longitud máxima de una etiqueta ya normalizada. */
export const MAX_TAG_LENGTH = 24;

/**
 * Normaliza una etiqueta a slug canónico:
 *   "#KDS" → "kds" · " Bar Pepe " → "bar-pepe" · "Configuración" → "configuracion"
 *
 * Quita el '#' inicial, pasa a minúsculas, elimina diacríticos, convierte
 * cualquier separador en guión y recorta. Devuelve "" si no queda nada
 * utilizable (el llamante debe descartar las cadenas vacías).
 *
 * Nota: la eliminación de diacríticos se hace aquí en JS, NO con unaccent()
 * en Postgres — el pooler no soporta esa extensión (ver CLAUDE.md).
 */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, "")
    .normalize("NFD")
    // Rango de marcas diacríticas combinantes de Unicode.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TAG_LENGTH)
    // El slice puede dejar un guión colgando al final.
    .replace(/-+$/, "");
}

/**
 * Normaliza una lista de etiquetas: descarta vacías, deduplica preservando
 * el orden de aparición y recorta a `MAX_TAGS_PER_ENTRY`.
 */
export function normalizeTags(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = normalizeTag(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS_PER_ENTRY) break;
  }
  return out;
}

/** Etiqueta legible para mostrar: "configuracion" → "configuración" cuando la conocemos. */
const DISPLAY_OVERRIDES: Record<string, string> = {
  configuracion: "configuración",
  instalacion: "instalación",
  comandera: "comanderas",
  cajones: "cajones",
};

export function tagLabel(tag: string): string {
  return DISPLAY_OVERRIDES[tag] ?? tag;
}
