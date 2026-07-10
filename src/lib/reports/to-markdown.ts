import type {
  ReportContent,
  KpiSnapshot,
  TiptapDoc,
  Highlights,
  Blockers,
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
): string {
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

  // 2. Resumen ejecutivo
  if (content.executiveSummary.rows.length > 0) {
    L.push("## 🚦 Resumen ejecutivo", "");
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

  // 4. Highlights
  const highlights = tipTap(content.highlights.doc);
  if (highlights) L.push("## ✅ Highlights", "", highlights, "");

  // 5. Bloqueos
  if (content.blockers.rows.length > 0) {
    L.push("## 🚧 Bloqueos abiertos", "");
    L.push("| Descripción | Owner | Impacto | Estado |");
    L.push("| --- | --- | --- | --- |");
    for (const r of content.blockers.rows) {
      const s =
        r.status === "bloqueado" ? "🔴 Bloqueado" : r.status === "en_progreso" ? "🟡 En progreso" : "🟢 Abierto";
      L.push(`| ${r.description || "—"} | ${r.owner || "—"} | ${r.impact || "—"} | ${s} |`);
    }
    L.push("");
  }

  // 6. Decisiones
  if (content.decisions.rows.length > 0) {
    const open = content.decisions.rows.filter((r) => r.status !== "cerrada");
    const closed = content.decisions.rows.filter((r) => r.status === "cerrada");
    L.push("## 🔴 Decisiones pendientes / cerradas", "");
    if (open.length > 0) {
      L.push("### Pendientes", "");
      L.push("| Estado | Descripción | Owner | Deadline | Resolución |");
      L.push("| --- | --- | --- | --- | --- |");
      for (const r of open) {
        const s = r.status === "escalada" ? "⬆️ Escalada" : "⏳ Pendiente";
        L.push(
          `| ${s} | ${r.description || "—"} | ${r.owner || "—"} | ${r.deadline || "—"} | ${r.resolution || "—"} |`,
        );
      }
      L.push("");
    }
    if (closed.length > 0) {
      L.push("### Cerradas", "");
      L.push("| Descripción | Owner | Resolución |");
      L.push("| --- | --- | --- |");
      for (const r of closed) {
        L.push(`| ${r.description || "—"} | ${r.owner || "—"} | ${r.resolution || "—"} |`);
      }
      L.push("");
    }
  }

  // 7. Activaciones
  const cfg = content.configuraciones;
  if (cfg.totalConfigs !== null || cfg.techBreakdown.length > 0 || cfg.problems || hasDeptExtras(cfg)) {
    L.push("## 🛠 Activaciones (Guille)", "");
    if (cfg.totalConfigs !== null) L.push(`- **Total configuraciones:** ${cfg.totalConfigs}`);
    if (cfg.successRate1st !== null) L.push(`- **Éxito 1ª config:** ${cfg.successRate1st}%`);
    if (cfg.successRate2nd !== null) L.push(`- **Éxito 2ª config:** ${cfg.successRate2nd}%`);
    if (cfg.totalConfigs !== null) L.push("");
    if (cfg.techBreakdown.length > 0) {
      L.push("**Breakdown por técnico**", "");
      L.push("| Técnico | Cantidad | Avg (min) | Éxito (%) |");
      L.push("| --- | ---: | ---: | ---: |");
      for (const r of cfg.techBreakdown) {
        L.push(`| ${r.technician || "—"} | ${r.count ?? "—"} | ${r.avgMinutes ?? "—"} | ${r.successRate ?? "—"} |`);
      }
      L.push("");
    }
    if (cfg.problems) L.push("**Problemas / Incidencias**", "", cfg.problems, "");
    pushDeptExtras(L, cfg.highlights, cfg.blockers);
  }

  // 8. Envíos
  const env = content.envios;
  if (
    env.totalOps !== null ||
    env.orders.length > 0 ||
    env.coveragePnp ||
    env.officeVsProvider ||
    hasDeptExtras(env)
  ) {
    L.push("## 🛠 Envíos y Logística (Domi)", "");
    const items = [
      env.totalOps !== null ? `**Total ops:** ${env.totalOps}` : null,
      env.completed !== null ? `**Completadas:** ${env.completed}` : null,
      env.shipped !== null ? `**Enviadas:** ${env.shipped}` : null,
      env.pending !== null ? `**Pendientes:** ${env.pending}` : null,
      env.avgDeliveryDays !== null ? `**Plazo medio:** ${env.avgDeliveryDays} días` : null,
      env.sla7dPct !== null ? `**SLA 7d:** ${env.sla7dPct}%` : null,
      env.coveragePnp ? `**Cobertura PnP:** ${env.coveragePnp}` : null,
      env.officeVsProvider ? `**Oficina vs Proveedor:** ${env.officeVsProvider}` : null,
    ].filter(Boolean);
    if (items.length > 0) L.push(...items.map((i) => `- ${i}`), "");
    if (env.orders.length > 0) {
      L.push("| Venue | Estado | Notas |");
      L.push("| --- | --- | --- |");
      for (const r of env.orders) {
        const s =
          r.status === "completado"
            ? "✅ Completado"
            : r.status === "enviado"
              ? "📦 Enviado"
              : r.status === "bloqueado"
                ? "🔴 Bloqueado"
                : "⏳ Pendiente";
        L.push(`| ${r.venue || "—"} | ${s} | ${r.notes || "—"} |`);
      }
      L.push("");
    }
    pushDeptExtras(L, env.highlights, env.blockers);
  }

  // 9. Soporte
  const sop = content.soporte;
  const sopNarrative = tipTap(sop.narrative);
  if (
    sop.openIncidents !== null ||
    sop.incidents.length > 0 ||
    sop.rmas.length > 0 ||
    sopNarrative ||
    hasDeptExtras(sop)
  ) {
    L.push("## 🛠 Soporte HW (Domi)", "");
    const sopItems = [
      sop.openIncidents !== null ? `**Incidencias abiertas:** ${sop.openIncidents}` : null,
      sop.incidentsOver7d !== null ? `**Incidencias >7d:** ${sop.incidentsOver7d}` : null,
      sop.activeRmas !== null ? `**RMAs activos:** ${sop.activeRmas}` : null,
      sop.sla7dPct !== null ? `**SLA cumplimiento:** ${sop.sla7dPct}%` : null,
      sop.criticalInSlaPct !== null ? `**% críticas en SLA:** ${sop.criticalInSlaPct}%` : null,
      sop.reopenRatePct !== null ? `**Tasa reapertura:** ${sop.reopenRatePct}%` : null,
      sop.avgResolutionHours !== null ? `**Resolución media:** ${sop.avgResolutionHours}h` : null,
      sop.avgRmaTurnaroundDays !== null ? `**Turnaround RMA:** ${sop.avgRmaTurnaroundDays} días` : null,
      sop.rmaResponseUnder2hPct !== null ? `**RMA resp. <2h:** ${sop.rmaResponseUnder2hPct}%` : null,
    ].filter(Boolean);
    if (sopItems.length > 0) L.push(...sopItems.map((i) => `- ${i}`), "");
    if (sopNarrative) L.push(sopNarrative, "");
    if (sop.incidents.length > 0) {
      L.push("**Incidencias destacadas**", "");
      L.push("| Cliente / Venue | Prioridad | Estado | Días | Comentario |");
      L.push("| --- | --- | --- | ---: | --- |");
      for (const r of sop.incidents) {
        L.push(
          `| ${r.customer || "—"} | ${r.priority} | ${r.status || "—"} | ${r.daysOpen ?? "—"} | ${r.comment || "—"} |`,
        );
      }
      L.push("");
    }
    if (sop.rmas.length > 0) {
      L.push("**RMAs activos**", "");
      L.push("| Proveedor | Dispositivo | Estado | Días | Notas |");
      L.push("| --- | --- | --- | ---: | --- |");
      for (const r of sop.rmas) {
        L.push(
          `| ${r.provider || "—"} | ${r.device || "—"} | ${r.status || "—"} | ${r.daysOpen ?? "—"} | ${r.notes || "—"} |`,
        );
      }
      L.push("");
    }
    pushDeptExtras(L, sop.highlights, sop.blockers);
  }

  // 10. Cajones inteligentes
  const caj = content.cajones;
  if (caj.rows.length > 0 || hasDeptExtras(caj)) {
    L.push("## 🗄 Cajones inteligentes (JJ)", "");
    if (caj.rows.length > 0) {
      L.push("| Cliente | Estado | Proveedor | Notas | MRR (€) |");
      L.push("| --- | --- | --- | --- | ---: |");
      for (const r of caj.rows) {
        L.push(
          `| ${r.client || "—"} | ${r.status || "—"} | ${r.provider || "—"} | ${r.notes || "—"} | ${r.mrr != null ? r.mrr.toLocaleString("es-ES") : "—"} |`,
        );
      }
      const totalMrr = caj.rows.reduce((s, r) => s + (r.mrr ?? 0), 0);
      if (totalMrr > 0) {
        L.push(`|  |  |  | **Total MRR** | **${totalMrr.toLocaleString("es-ES")} €** |`);
      }
      L.push("");
    }
    pushDeptExtras(L, caj.highlights, caj.blockers);
  }

  // 11. Marco Informe
  const marco = content.marco;
  const marcoNarrative = tipTap(marco.narrative);
  if (marcoNarrative || hasDeptExtras(marco)) {
    L.push("## 🧭 Marco Informe", "");
    if (marcoNarrative) L.push(marcoNarrative, "");
    pushDeptExtras(L, marco.highlights, marco.blockers);
  }

  // 11. Performance del equipo
  const perfMembers = content.performance.members.filter(
    (m) => m.kpis.length > 0 || tipTap(m.narrative),
  );
  if (perfMembers.length > 0) {
    L.push("## 👥 Performance del equipo", "");
    for (const m of perfMembers) {
      L.push(`### ${m.displayName}`, "");
      if (m.kpis.length > 0) {
        L.push("| KPI | Valor | Target | Estado |");
        L.push("| --- | ---: | ---: | :---: |");
        for (const k of m.kpis) {
          const s =
            k.status === "verde" ? "🟢" : k.status === "amarillo" ? "🟡" : k.status === "rojo" ? "🔴" : "—";
          L.push(`| ${k.label || "—"} | ${k.value || "—"} | ${k.target || "—"} | ${s} |`);
        }
        L.push("");
      }
      const narrative = tipTap(m.narrative);
      if (narrative) L.push(narrative, "");
    }
  }

  // 12. Foco próxima semana
  if (content.nextFocus.rows.length > 0) {
    L.push("## 📌 Foco próxima semana", "");
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
