import type {
  ReportContent,
  KpiSnapshot,
  TiptapDoc,
  Highlights,
  Blockers,
  MemberSection,
} from "./schema";

type PmNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: { href?: string } }[];
  content?: PmNode[];
};

export function contentToMarkdown(
  meta: {
    title: string;
    periodLabel: string;
    globalStatus: string | null;
    publishedAt: string | null;
  },
  content: ReportContent,
  _snapshot: KpiSnapshot | null,
  options: { showPerformance?: boolean } = {},
): string {
  const showPerformance = options.showPerformance ?? false;
  const L: string[] = [];

  const statusEmoji =
    meta.globalStatus === "verde"
      ? "🟢"
      : meta.globalStatus === "amarillo"
        ? "🟡"
        : meta.globalStatus === "rojo"
          ? "🔴"
          : "";

  L.push(`# ${statusEmoji} ${meta.title}`);
  if (content.author) L.push(`> Autor: ${content.author}`);
  L.push(`> ${meta.periodLabel}`);
  if (meta.publishedAt) {
    L.push(
      `> Publicado el ${new Date(meta.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`,
    );
  }
  L.push("");

  // 1. Tesis
  const tesis = tipTap(content.tesis.doc);
  if (tesis) L.push("## 🎯 Tesis de la semana", "", tesis, "");

  // 2. KPIs generales
  if (content.executiveSummary.rows.length > 0) {
    L.push("## 🚦 KPIs generales", "");
    L.push("| KPI | Target | Actual | Semana anterior | Owner | Estado | Comentario |");
    L.push("| --- | --- | --- | --- | --- | :---: | --- |");
    for (const r of content.executiveSummary.rows) {
      const s =
        r.status === "verde" ? "🟢" : r.status === "amarillo" ? "🟡" : r.status === "rojo" ? "🔴" : "—";
      L.push(
        `| ${r.label || "—"} | ${r.target || "—"} | ${r.actual || "—"} | ${r.delta || "—"} | ${r.owner || "—"} | ${s} | ${r.comment || ""} |`,
      );
    }
    L.push("");
  }

  // 3. Detalle ámbar/rojo
  if (content.amberRed.rows.length > 0) {
    L.push("## 🔴🟡 Detalle ámbar/rojo", "");
    L.push("| Estado | KPI / Área | Causa raíz | Acción correctora | ETA | Escalado a |");
    L.push("| :---: | --- | --- | --- | --- | --- |");
    for (const r of content.amberRed.rows) {
      const s = r.status === "rojo" ? "🔴" : "🟡";
      L.push(
        `| ${s} | ${r.kpi || "—"} | ${r.rootCause || "—"} | ${r.action || "—"} | ${r.eta || "—"} | ${r.escalation || "—"} |`,
      );
    }
    L.push("");
  }

  // 4-6. Secciones por persona
  pushMember(L, "Guillermo", content.guillermo);
  pushMember(L, "Domingo", content.domingo);
  pushMember(L, "Marco", content.marco);

  // 7. Performance del equipo (solo jj)
  if (showPerformance) {
    const perfMembers = content.performance.members.filter((m) => tipTap(m.narrative));
    if (perfMembers.length > 0) {
      L.push("## 👥 Performance del equipo", "");
      for (const m of perfMembers) {
        L.push(`### ${m.displayName}`, "", tipTap(m.narrative), "");
      }
    }
  }

  // 8. I+D status WIP
  const idStatus = tipTap(content.idStatus.doc);
  if (idStatus) L.push("## 🔬 I+D status WIP", "", idStatus, "");

  // 9. Foco del mes / semana
  if (content.nextFocus.rows.length > 0) {
    L.push("## 📌 Foco del mes / semana", "");
    L.push("| Prioridad | Responsable | Objetivo | Output |");
    L.push("| :---: | --- | --- | --- |");
    for (const r of content.nextFocus.rows) {
      const p = r.priority === "alta" ? "🔴 Alta" : r.priority === "baja" ? "🟢 Baja" : "🟡 Media";
      L.push(`| ${p} | ${r.owner || "—"} | ${r.objective || "—"} | ${r.output || "—"} |`);
    }
    L.push("");
  }

  return L.join("\n");
}

// ── Secciones por persona ────────────────────────────────────────────────────

function pushMember(L: string[], title: string, data: MemberSection): void {
  const hasKpis = data.kpisPersonales.length > 0;
  if (!hasKpis && !hasDeptExtras(data)) return;
  L.push(`## 🧭 ${title}`, "");
  if (hasKpis) {
    L.push("| KPI | Valor | Target | Estado |");
    L.push("| --- | --- | --- | :---: |");
    for (const k of data.kpisPersonales) {
      const s =
        k.status === "verde" ? "🟢" : k.status === "amarillo" ? "🟡" : k.status === "rojo" ? "🔴" : "—";
      L.push(`| ${k.label || "—"} | ${k.value || "—"} | ${k.target || "—"} | ${s} |`);
    }
    L.push("");
  }
  pushDeptExtras(L, data.highlights, data.blockers);
}

// ── Highlights + Bloqueos por departamento ──────────────────────────────────

function hasDeptExtras(d: { highlights: Highlights; blockers: Blockers }): boolean {
  return (d.highlights.doc.content?.length ?? 0) > 0 || d.blockers.rows.length > 0;
}

function pushDeptExtras(L: string[], highlights: Highlights, blockers: Blockers): void {
  const hl = tipTap(highlights.doc);
  if (hl) L.push("**Highlights**", "", hl, "");
  if (blockers.rows.length > 0) {
    L.push("**Bloqueos**", "");
    L.push("| Descripción | Owner | Impacto | Estado |");
    L.push("| --- | --- | --- | --- |");
    for (const r of blockers.rows) {
      const s =
        r.status === "bloqueado"
          ? "🔴 Bloqueado"
          : r.status === "en_progreso"
            ? "🟡 En progreso"
            : "🟢 Abierto";
      L.push(`| ${r.description || "—"} | ${r.owner || "—"} | ${r.impact || "—"} | ${s} |`);
    }
    L.push("");
  }
}

// ── TipTap → Markdown ────────────────────────────────────────────────────────

export function tipTap(doc: TiptapDoc): string {
  if (!doc.content?.length) return "";
  return doc.content.map(nodeToMd).filter(Boolean).join("\n\n");
}

function nodeToMd(node: PmNode): string {
  switch (node.type) {
    case "paragraph":
      return node.content?.map(nodeToMd).join("") ?? "";
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      return `${"#".repeat(level)} ${node.content?.map(nodeToMd).join("") ?? ""}`;
    }
    case "text": {
      let text = node.text ?? "";
      const marks = node.marks ?? [];
      if (marks.some((m) => m.type === "bold")) text = `**${text}**`;
      if (marks.some((m) => m.type === "italic")) text = `*${text}*`;
      const link = marks.find((m) => m.type === "link");
      if (link) text = `[${text}](${link.attrs?.href ?? ""})`;
      return text;
    }
    case "bulletList":
      return node.content?.map((li) => `- ${nodeToMd(li)}`).join("\n") ?? "";
    case "orderedList":
      return node.content?.map((li, i) => `${i + 1}. ${nodeToMd(li)}`).join("\n") ?? "";
    case "listItem":
      return node.content?.map(nodeToMd).join(" ") ?? "";
    case "hardBreak":
      return "  \n";
    default:
      return node.content?.map(nodeToMd).join("") ?? node.text ?? "";
  }
}
