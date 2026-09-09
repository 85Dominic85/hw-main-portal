import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import type { TiptapDoc } from "@/lib/reports/schema";
import { tipTap } from "@/lib/reports/to-markdown";
import { firstLine } from "./body-text";
import { tagLabel } from "./tags";
import { authorDisplayName, type WeeklySummary } from "./weekly-summary";
import { formatDayLabel } from "./work-week";

/**
 * Recopilatorio semanal → Markdown.
 *
 * Estructura de salida: SCORECARD arriba (la capa C, calculada) y DIARIO
 * completo debajo (la capa A). Sirve a los dos lectores del documento: quien
 * solo quiere el pulso de la semana lee la portada y se va; quien en noviembre
 * necesita recordar qué se hizo en un local tiene el detalle.
 *
 * Reutiliza `tipTap()` de `@/lib/reports/to-markdown` para serializar el body,
 * que es puro y funciona en servidor.
 */

/** Título de la entrada: el suyo, o la primera línea del cuerpo. */
export function entryHeading(entry: LogEntryRow): string {
  return entry.title?.trim() || firstLine(entry.body as TiptapDoc) || "(sin título)";
}

const STATUS_LABEL: Record<string, string> = {
  abierta: "Abierta",
  resuelta: "Resuelta",
  seguimiento: "En seguimiento",
};

/** Línea de metadatos de una entrada: autor · cliente · etiquetas · estado. */
function metaLine(entry: LogEntryRow, opts: { withAuthor?: boolean } = {}): string {
  const bits: string[] = [];
  if (opts.withAuthor !== false) bits.push(authorDisplayName(entry));
  if (entry.client?.trim()) bits.push(entry.client.trim());
  if (entry.tags?.length) bits.push(entry.tags.map((t) => `\`${tagLabel(t)}\``).join(" "));
  if (entry.status) bits.push(`**${STATUS_LABEL[entry.status] ?? entry.status}**`);
  return bits.join(" · ");
}

function entryBlock(entry: LogEntryRow, opts: { withAuthor?: boolean } = {}): string[] {
  const lines: string[] = [`**${entryHeading(entry)}**`];
  const meta = metaLine(entry, opts);
  if (meta) lines.push(meta);

  const body = tipTap(entry.body as TiptapDoc).trim();
  if (body) lines.push(body);

  return lines;
}

export function summaryToMarkdown(summary: WeeklySummary): string {
  const L: string[] = [];

  // ── Cabecera ──────────────────────────────────────────────────────────
  L.push(`# Bitácora · ${summary.label}`, "");

  const { totals } = summary;
  L.push(
    `**${totals.entries} entradas registradas** · ${totals.perWorkDay} al día laborable · ` +
      `${totals.clients} ${totals.clients === 1 ? "cliente" : "clientes"} · ` +
      `${totals.authors.length} ${totals.authors.length === 1 ? "autor" : "autores"}`,
    "",
  );

  // ── Scorecard (capa C) ────────────────────────────────────────────────
  L.push("## Resumen de la semana", "");

  if (totals.incidents.total > 0) {
    const i = totals.incidents;
    const parts = [`${i.total} con estado`];
    if (i.resueltas) parts.push(`${i.resueltas} resueltas`);
    if (i.abiertas) parts.push(`${i.abiertas} abiertas`);
    if (i.seguimiento) parts.push(`${i.seguimiento} en seguimiento`);
    L.push(`- **Incidencias**: ${parts.join(" · ")}`);
  }

  if (summary.tagRanking.length) {
    const top = summary.tagRanking
      .slice(0, 6)
      .map((t) => `${tagLabel(t.tag)} (${t.count})`)
      .join(", ");
    L.push(`- **Dónde se fue la semana**: ${top}`);
  }

  if (totals.authors.length) {
    L.push(
      `- **Reparto**: ${totals.authors.map((a) => `${a.name} ${a.entries}`).join(" · ")}`,
    );
  }

  if (summary.clients.length) {
    L.push(`- **Clientes tocados**: ${summary.clients.join(", ")}`);
  }

  // Actividad por día laborable, como texto (una gráfica no cabe en Markdown).
  const activity = summary.byWorkDay
    .map((d) => `${d.label} ${d.entries.length}`)
    .join(" · ");
  L.push(`- **Actividad**: ${activity}`);

  if (summary.offHours.length) {
    L.push(
      `- **Fuera de horario**: ${summary.offHours.length} ` +
        `${summary.offHours.length === 1 ? "entrada" : "entradas"} en fin de semana`,
    );
  }
  L.push("");

  // ── Lo que hay que mirar ──────────────────────────────────────────────
  if (summary.highlights.length) {
    L.push("## Lo que hay que mirar", "");
    for (const entry of summary.highlights) {
      L.push(...entryBlock(entry), "");
    }
  }

  // ── Sigue abierto ─────────────────────────────────────────────────────
  const openNotHighlighted = summary.openItems.filter(
    (e) => !summary.highlights.some((h) => h.id === e.id),
  );
  if (openNotHighlighted.length) {
    L.push("## Sigue abierto", "");
    for (const entry of openNotHighlighted) {
      L.push(`- **${entryHeading(entry)}** — ${metaLine(entry)}`);
    }
    L.push("");
  }

  // ── Diario completo (capa A) ──────────────────────────────────────────
  L.push("## Diario de la semana", "");

  if (summary.totals.entries === 0) {
    L.push("_No se registró ninguna entrada esta semana._", "");
  }

  for (const day of summary.byWorkDay) {
    if (day.entries.length === 0) continue;
    L.push(`### ${capitalize(formatDayLabel(day.dateKey))}`, "");
    for (const entry of day.entries) {
      L.push(...entryBlock(entry), "");
    }
  }

  if (summary.offHours.length) {
    L.push("### Fuera de horario", "");
    for (const entry of summary.offHours) {
      L.push(
        `_${capitalize(formatDayLabel(String(entry.entryDate).slice(0, 10)))}_`,
        ...entryBlock(entry),
        "",
      );
    }
  }

  return L.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/**
 * Variante Notion: añade divisores horizontales entre secciones de nivel 2.
 * Notion renderiza `---` como un bloque Divisor, así que el pegado queda
 * visualmente limpio. Mismo truco que `to-notion-markdown.ts` de informes.
 */
export function summaryToNotionMarkdown(summary: WeeklySummary): string {
  return summaryToMarkdown(summary).replace(/\n(## )/g, "\n\n---\n\n$1");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
