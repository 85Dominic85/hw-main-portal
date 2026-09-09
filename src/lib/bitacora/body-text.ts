import type { TiptapDoc } from "@/lib/reports/schema";

/**
 * TipTap doc → texto plano, para poblar `log_entries.body_text` y poder
 * buscar con ILIKE + índice trigram.
 *
 * Recorre el árbol igual que `tipTap()` de `@/lib/reports/to-markdown`, pero
 * sin emitir marcas de Markdown: aquí solo interesan las palabras.
 *
 * Módulo puro y neutro (solo tipos) — importable desde cliente y servidor.
 */

/** Nodo ProseMirror tal y como lo valida `tiptapDocSchema` (estructura laxa). */
interface PmNode {
  type: string;
  text?: string | undefined;
  content?: PmNode[] | undefined;
}

/** Nodos que separan párrafo: su contenido no debe pegarse al siguiente. */
const BLOCK_NODES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
]);

export function tiptapToPlainText(doc: TiptapDoc | null | undefined): string {
  if (!doc?.content?.length) return "";
  const lines: string[] = [];
  for (const node of doc.content as PmNode[]) {
    collect(node, lines);
  }
  return lines
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function collect(node: PmNode, lines: string[]): void {
  if (node.type === "text") {
    appendInline(lines, node.text ?? "");
    return;
  }
  if (node.type === "hardBreak") {
    lines.push("");
    return;
  }

  if (BLOCK_NODES.has(node.type)) {
    lines.push("");
    for (const child of node.content ?? []) collect(child, lines);
    return;
  }

  // bulletList / orderedList y cualquier nodo desconocido: bajar sin cortar.
  for (const child of node.content ?? []) collect(child, lines);
  if (!node.content?.length && node.text) appendInline(lines, node.text);
}

/** Añade texto al final de la línea en curso (creándola si hace falta). */
function appendInline(lines: string[], text: string): void {
  if (!text) return;
  if (lines.length === 0) {
    lines.push(text);
    return;
  }
  lines[lines.length - 1] += text;
}

/**
 * Primera línea con contenido del body. La usan la UI y los exports cuando la
 * entrada no tiene `title`: una entrada sin título se identifica por cómo empieza.
 */
export function firstLine(doc: TiptapDoc | null | undefined, maxLength = 90): string {
  const [first = ""] = tiptapToPlainText(doc).split("\n");
  return first.length > maxLength ? `${first.slice(0, maxLength - 1).trimEnd()}…` : first;
}

/** True si el documento no tiene ni una palabra (un doc "vacío" de TipTap la tiene). */
export function isEmptyDoc(doc: TiptapDoc | null | undefined): boolean {
  return tiptapToPlainText(doc).length === 0;
}
