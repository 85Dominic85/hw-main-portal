import type {
  ReportContent,
  KpiSnapshot,
  TiptapDoc,
  Highlights,
  Blockers,
  MemberCommon,
  PersonalKpiRow,
  RndTools,
  Rma,
  Cajones,
} from "./schema";
import { RMA_ESTADO_LABEL } from "./labels";

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
  pushGuillermo(L, content.guillermo);
  pushDomingo(L, content.domingo);
  pushMarco(L, content.marco);

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

const strHas = (...v: string[]) => v.some((s) => s.trim().length > 0);
const rndHasContent = (t: RndTools) => t.items.some((i) => strHas(i.tool, i.detail));

function commonHasContent(m: MemberCommon): boolean {
  return m.kpisPersonales.length > 0 || rndHasContent(m.toolsRnd) || hasDeptExtras(m);
}

function pushMemberKpis(L: string[], rows: PersonalKpiRow[]): void {
  if (rows.length === 0) return;
  L.push("| KPI | Valor | Target | Estado |");
  L.push("| --- | --- | --- | :---: |");
  for (const k of rows) {
    const s =
      k.status === "verde" ? "🟢" : k.status === "amarillo" ? "🟡" : k.status === "rojo" ? "🔴" : "—";
    L.push(`| ${k.label || "—"} | ${k.value || "—"} | ${k.target || "—"} | ${s} |`);
  }
  L.push("");
}

function pushField(L: string[], label: string, value: string): void {
  if (!value.trim()) return;
  L.push(`**${label}**`, "", value.trim(), "");
}

function pushRndTools(L: string[], value: RndTools): void {
  const items = value.items.filter((i) => strHas(i.tool, i.detail));
  if (items.length === 0) return;
  L.push("### Herramientas I+D", "");
  for (const it of items) {
    L.push(`- **${it.tool || "—"}**${it.detail.trim() ? ` — ${it.detail.trim()}` : ""}`);
  }
  L.push("");
}

function pushRma(L: string[], value: Rma): void {
  if (value.casos.length === 0) return;
  L.push("### RMA y Proveedores", "");
  L.push("| Caso | Estado | SLA respuesta |");
  L.push("| --- | --- | --- |");
  for (const r of value.casos) {
    L.push(`| ${r.caso || "—"} | ${RMA_ESTADO_LABEL[r.estado] ?? r.estado} | ${r.sla || "—"} |`);
  }
  L.push("");
}

function pushCajones(L: string[], value: Cajones): void {
  const tiles: Array<[string, string]> = [
    ["Clientes nuevos", value.clientesNuevos],
    ["Activados", value.activados],
    ["Pendientes", value.pendientes],
    ["MRR nuevo actual", value.mrrNuevo],
  ];
  if (!tiles.some(([, v]) => v.trim())) return;
  L.push("### Cajones", "");
  L.push("| Clientes nuevos | Activados | Pendientes | MRR nuevo actual |");
  L.push("| --- | --- | --- | --- |");
  L.push(`| ${tiles.map(([, v]) => v.trim() || "—").join(" | ")} |`);
  L.push("");
}

function pushGuillermo(L: string[], g: ReportContent["guillermo"]): void {
  const has =
    commonHasContent(g) ||
    strHas(g.contabilidad.vencimientos, g.contabilidad.facturas, g.contabilidad.reinversion) ||
    strHas(g.amExperience.incidencias, g.amExperience.mejoras);
  if (!has) return;
  L.push("## 🧭 Guillermo", "");
  pushMemberKpis(L, g.kpisPersonales);
  pushRndTools(L, g.toolsRnd);
  if (strHas(g.contabilidad.vencimientos, g.contabilidad.facturas, g.contabilidad.reinversion)) {
    L.push("### Contabilidad", "");
    pushField(L, "Vencimientos", g.contabilidad.vencimientos);
    pushField(L, "Facturas", g.contabilidad.facturas);
    pushField(L, "Reinversión", g.contabilidad.reinversion);
  }
  if (strHas(g.amExperience.incidencias, g.amExperience.mejoras)) {
    L.push("### AM Experience", "");
    pushField(L, "Incidencias", g.amExperience.incidencias);
    pushField(L, "Mejoras", g.amExperience.mejoras);
  }
  pushDeptExtras(L, g.highlights, g.blockers);
}

function pushDomingo(L: string[], d: ReportContent["domingo"]): void {
  const has =
    commonHasContent(d) ||
    d.rma.casos.length > 0 ||
    strHas(d.kds.nuevosClientes, d.kds.cambiosUso, d.kds.pendientes);
  if (!has) return;
  L.push("## 🧭 Domingo", "");
  pushMemberKpis(L, d.kpisPersonales);
  pushRndTools(L, d.toolsRnd);
  pushRma(L, d.rma);
  if (strHas(d.kds.nuevosClientes, d.kds.cambiosUso, d.kds.pendientes)) {
    L.push("### KDS", "");
    pushField(L, "Nuevos clientes", d.kds.nuevosClientes);
    pushField(L, "Cambios en el uso general", d.kds.cambiosUso);
    pushField(L, "Pendientes (esta semana → siguiente)", d.kds.pendientes);
  }
  pushDeptExtras(L, d.highlights, d.blockers);
}

function pushMarco(L: string[], m: ReportContent["marco"]): void {
  const has =
    commonHasContent(m) ||
    strHas(m.cajones.clientesNuevos, m.cajones.activados, m.cajones.pendientes, m.cajones.mrrNuevo) ||
    (m.qExperience.doc.content?.length ?? 0) > 0;
  if (!has) return;
  L.push("## 🧭 Marco", "");
  pushMemberKpis(L, m.kpisPersonales);
  pushRndTools(L, m.toolsRnd);
  pushCajones(L, m.cajones);
  const q = tipTap(m.qExperience.doc);
  if (q) L.push("### Q Experience", "", q, "");
  pushDeptExtras(L, m.highlights, m.blockers);
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
