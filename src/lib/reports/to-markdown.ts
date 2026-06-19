import type { ReportContent, KpiSnapshot, TiptapDoc } from "./schema";

/**
 * Serializa un informe a Markdown compatible con Notion (GFM).
 * TipTap → texto plano + listas. Tablas en GFM.
 */
export function contentToMarkdown(
  meta: {
    title: string;
    periodLabel: string;
    globalStatus: string | null;
    publishedAt: string | null;
  },
  content: ReportContent,
  snapshot: KpiSnapshot | null,
): string {
  const lines: string[] = [];

  const statusEmoji =
    meta.globalStatus === "verde"
      ? "🟢"
      : meta.globalStatus === "amarillo"
        ? "🟡"
        : meta.globalStatus === "rojo"
          ? "🔴"
          : "";

  lines.push(`# ${statusEmoji} ${meta.title}`);
  lines.push(`> ${meta.periodLabel}`);
  if (meta.publishedAt) {
    lines.push(
      `> Publicado el ${new Date(meta.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`,
    );
  }
  lines.push("");

  // Tesis
  const tesis = tiptapToMarkdown(content.tesis.doc);
  if (tesis) {
    lines.push("## 🎯 Tesis de la semana", "", tesis, "");
  }

  // Resumen ejecutivo con snapshot
  if (snapshot && snapshot.entries.length > 0) {
    lines.push("## 🚦 Resumen ejecutivo", "");
    lines.push("| KPI | Valor | Unidad | Fuente |");
    lines.push("| --- | ---: | --- | --- |");
    for (const e of snapshot.entries) {
      const val =
        e.value !== null && e.value !== undefined
          ? e.value.toLocaleString("es-ES", { maximumFractionDigits: 1 })
          : "—";
      lines.push(`| ${e.key} | ${val} | ${e.unit ?? ""} | ${e.source} |`);
    }
    lines.push("");
  }

  // Highlights
  const highlights = tiptapToMarkdown(content.highlights.doc);
  if (highlights) {
    lines.push("## ✅ Highlights", "", highlights, "");
  }

  // Comentarios Pablo
  const pablo = tiptapToMarkdown(content.pabloComments.doc);
  if (pablo) {
    lines.push("## 💬 Comentarios Pablo", "", pablo, "");
  }

  return lines.join("\n");
}

/**
 * Convierte un doc ProseMirror (TipTap JSON) a Markdown GFM.
 * Implementación mínima para Fase 1: texto, párrafos, headings, listas, negrita, cursiva.
 */
function tiptapToMarkdown(doc: TiptapDoc): string {
  if (!doc.content?.length) return "";
  return doc.content.map(nodeToMd).filter(Boolean).join("\n\n");
}

function nodeToMd(node: { type: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string }[]; content?: typeof node[] }): string {
  switch (node.type) {
    case "paragraph":
      return (node.content?.map(nodeToMd).join("") ?? "");
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const hashes = "#".repeat(level);
      return `${hashes} ${node.content?.map(nodeToMd).join("") ?? ""}`;
    }
    case "text": {
      let text = node.text ?? "";
      const marks = node.marks ?? [];
      if (marks.some((m) => m.type === "bold")) text = `**${text}**`;
      if (marks.some((m) => m.type === "italic")) text = `*${text}*`;
      if (marks.some((m) => m.type === "link")) {
        const href = marks.find((m) => m.type === "link") as { type: string; attrs?: { href?: string } } | undefined;
        text = `[${text}](${href?.attrs?.href ?? ""})`;
      }
      return text;
    }
    case "bulletList":
      return (node.content?.map((li) => `- ${nodeToMd(li)}`).join("\n") ?? "");
    case "orderedList":
      return (
        node.content
          ?.map((li, i) => `${i + 1}. ${nodeToMd(li)}`)
          .join("\n") ?? ""
      );
    case "listItem":
      return (node.content?.map(nodeToMd).join(" ") ?? "");
    case "hardBreak":
      return "  \n";
    default:
      return (node.content?.map(nodeToMd).join("") ?? node.text ?? "");
  }
}
