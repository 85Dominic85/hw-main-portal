import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ReportContent, KpiSnapshot, TiptapDoc, Highlights, Blockers } from "@/lib/reports/schema";

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.45,
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 52,
    paddingRight: 52,
    color: "#1a1a1a",
  },
  // Header
  header: { marginBottom: 20, borderBottom: "1.5px solid #e5e7eb", paddingBottom: 12 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  period: { fontSize: 10, color: "#6b7280" },
  statusBadge: {
    fontSize: 8.5,
    color: "#ffffff",
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  // Sections
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "0.75px solid #d1d5db",
    color: "#111827",
  },
  subSectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 8,
    color: "#374151",
  },
  paragraph: { marginBottom: 5, lineHeight: 1.5 },
  // Tables
  table: { marginTop: 4 },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #e5e7eb",
    minHeight: 20,
    alignItems: "center",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: "1px solid #d1d5db",
    minHeight: 20,
    alignItems: "center",
  },
  cell: { flex: 1, paddingHorizontal: 5, paddingVertical: 3, fontSize: 9 },
  cellHeader: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
  },
  cellNarrow: { flex: 0.5 },
  cellWide: { flex: 2 },
  // Metric list
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  metricBox: {
    border: "0.75px solid #e5e7eb",
    borderRadius: 4,
    padding: 6,
    minWidth: 90,
    maxWidth: 140,
  },
  metricLabel: { fontSize: 7.5, color: "#9ca3af", marginBottom: 2 },
  metricValue: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  // Bullet list
  bulletRow: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 10, color: "#6b7280" },
  bulletText: { flex: 1 },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

type PmNode = {
  type: string;
  text?: string;
  content?: PmNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
};

function extractText(node: PmNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.content) return node.content.map(extractText).join("");
  return "";
}

function tiptapLines(doc: TiptapDoc): string[] {
  return (doc.content as PmNode[] | undefined ?? [])
    .map(extractText)
    .filter(Boolean);
}

function hasDoc(doc: TiptapDoc): boolean {
  return Array.isArray(doc.content) && doc.content.length > 0;
}

function statusText(s: string): string {
  if (s === "verde") return "Verde";
  if (s === "amarillo") return "Ambar";
  if (s === "rojo") return "Rojo";
  return "—";
}

function statusColor(s: string): string {
  if (s === "verde") return "#16a34a";
  if (s === "amarillo") return "#ca8a04";
  if (s === "rojo") return "#dc2626";
  return "#9ca3af";
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SubTitle({ children }: { children: string }) {
  return <Text style={styles.subSectionTitle}>{children}</Text>;
}

function TiptapBlock({ doc }: { doc: TiptapDoc }) {
  const lines = tiptapLines(doc);
  return (
    <View>
      {lines.map((line, i) => (
        <Text key={i} style={styles.paragraph}>{line}</Text>
      ))}
    </View>
  );
}

function hasExtras(d: { highlights: Highlights; blockers: Blockers }): boolean {
  return hasDoc(d.highlights.doc) || d.blockers.rows.length > 0;
}

function DeptExtrasBlock({ highlights, blockers }: { highlights: Highlights; blockers: Blockers }) {
  const hasHl = hasDoc(highlights.doc);
  const hasBlk = blockers.rows.length > 0;
  if (!hasHl && !hasBlk) return null;
  return (
    <View style={{ marginTop: 6 }}>
      {hasHl && (
        <>
          <SubTitle>Highlights</SubTitle>
          <TiptapBlock doc={highlights.doc} />
        </>
      )}
      {hasBlk && (
        <>
          <SubTitle>Bloqueos</SubTitle>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.cellHeader, styles.cellWide]}>Descripcion</Text>
              <Text style={styles.cellHeader}>Owner</Text>
              <Text style={styles.cellHeader}>Impacto</Text>
              <Text style={styles.cellHeader}>Estado</Text>
            </View>
            {blockers.rows.map((r) => (
              <View key={r.id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.cellWide]}>{r.description || "—"}</Text>
                <Text style={styles.cell}>{r.owner || "—"}</Text>
                <Text style={[styles.cell, { color: "#6b7280" }]}>{r.impact || "—"}</Text>
                <Text style={styles.cell}>
                  {r.status === "bloqueado"
                    ? "Bloqueado"
                    : r.status === "en_progreso"
                      ? "En progreso"
                      : "Abierto"}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── Documento principal ───────────────────────────────────────────────────────

interface Props {
  report: {
    title: string;
    periodLabel: string;
    globalStatus: string | null;
    publishedAt: string | null;
  };
  content: ReportContent;
  snapshot: KpiSnapshot | null;
}

export function ReportPdfDocument({ report, content, snapshot: _snapshot }: Props) {
  const hasExecutiveSummary = content.executiveSummary.rows.length > 0;
  const hasAmberRed = content.amberRed.rows.length > 0;
  const hasHighlights = hasDoc(content.highlights.doc);
  const hasBlockers = content.blockers.rows.length > 0;
  const hasDecisions = content.decisions.rows.length > 0;
  const hasCfg =
    content.configuraciones.totalConfigs !== null ||
    content.configuraciones.techBreakdown.length > 0 ||
    hasExtras(content.configuraciones);
  const hasEnvios =
    content.envios.totalOps !== null ||
    content.envios.orders.length > 0 ||
    hasExtras(content.envios);
  const hasSoporte =
    content.soporte.openIncidents !== null ||
    content.soporte.incidents.length > 0 ||
    content.soporte.rmas.length > 0 ||
    hasDoc(content.soporte.narrative) ||
    hasExtras(content.soporte);
  const hasCajones = content.cajones.rows.length > 0 || hasExtras(content.cajones);
  const hasPerf = content.performance.members.some(
    (m) => m.kpis.length > 0 || hasDoc(m.narrative),
  );
  const hasNextFocus = content.nextFocus.rows.length > 0;
  const hasMarco =
    hasDoc(content.marco.highlights.doc) ||
    content.marco.blockers.rows.length > 0 ||
    hasDoc(content.marco.narrative);

  return (
    <Document
      title={report.title}
      author="HW Main Portal"
      subject={report.periodLabel}
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          {content.author ? (
            <Text style={styles.period}>Autor: {content.author}</Text>
          ) : null}
          <Text style={styles.period}>{report.periodLabel}</Text>
          {report.globalStatus && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor(report.globalStatus) },
              ]}
            >
              <Text>{statusText(report.globalStatus).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* ── Tesis ── */}
        {hasDoc(content.tesis.doc) && (
          <View style={styles.section}>
            <SectionTitle>Tesis de la semana</SectionTitle>
            <TiptapBlock doc={content.tesis.doc} />
          </View>
        )}

        {/* ── Resumen ejecutivo ── */}
        {hasExecutiveSummary && (
          <View style={styles.section}>
            <SectionTitle>Resumen ejecutivo</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cellHeader, styles.cellWide]}>KPI</Text>
                <Text style={styles.cellHeader}>Target</Text>
                <Text style={styles.cellHeader}>Actual</Text>
                <Text style={styles.cellHeader}>Sem. ant.</Text>
                <Text style={styles.cellHeader}>Owner</Text>
                <Text style={[styles.cellHeader, styles.cellNarrow]}>Estado</Text>
                <Text style={[styles.cellHeader, styles.cellWide]}>Comentario</Text>
              </View>
              {content.executiveSummary.rows.map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.cellWide]}>{r.label || "—"}</Text>
                  <Text style={styles.cell}>{r.target || "—"}</Text>
                  <Text style={styles.cell}>{r.actual || "—"}</Text>
                  <Text style={styles.cell}>{r.delta || "—"}</Text>
                  <Text style={styles.cell}>{r.owner || "—"}</Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.cellNarrow,
                      { color: statusColor(r.status) },
                    ]}
                  >
                    {statusText(r.status)}
                  </Text>
                  <Text style={[styles.cell, styles.cellWide, { color: "#6b7280" }]}>
                    {r.comment || ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Ámbar/Rojo ── */}
        {hasAmberRed && (
          <View style={styles.section}>
            <SectionTitle>Detalle ambar/rojo</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cellHeader, styles.cellNarrow]}>Est.</Text>
                <Text style={styles.cellHeader}>KPI / Area</Text>
                <Text style={styles.cellHeader}>Causa raiz</Text>
                <Text style={styles.cellHeader}>Accion</Text>
                <Text style={[styles.cellHeader, styles.cellNarrow]}>ETA</Text>
                <Text style={styles.cellHeader}>Escalado a</Text>
              </View>
              {content.amberRed.rows.map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text
                    style={[
                      styles.cell,
                      styles.cellNarrow,
                      { color: r.status === "rojo" ? "#dc2626" : "#ca8a04" },
                    ]}
                  >
                    {r.status === "rojo" ? "Rojo" : "Ambar"}
                  </Text>
                  <Text style={styles.cell}>{r.kpi || "—"}</Text>
                  <Text style={[styles.cell, { color: "#6b7280" }]}>{r.rootCause || "—"}</Text>
                  <Text style={styles.cell}>{r.action || "—"}</Text>
                  <Text style={[styles.cell, styles.cellNarrow, { fontFamily: "Courier" }]}>
                    {r.eta || "—"}
                  </Text>
                  <Text style={[styles.cell, { color: "#6b7280" }]}>{r.escalation || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Highlights ── */}
        {hasHighlights && (
          <View style={styles.section}>
            <SectionTitle>Highlights</SectionTitle>
            <TiptapBlock doc={content.highlights.doc} />
          </View>
        )}

        {/* ── Bloqueos ── */}
        {hasBlockers && (
          <View style={styles.section}>
            <SectionTitle>Bloqueos abiertos</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cellHeader, styles.cellWide]}>Descripcion</Text>
                <Text style={styles.cellHeader}>Owner</Text>
                <Text style={styles.cellHeader}>Impacto</Text>
                <Text style={styles.cellHeader}>Estado</Text>
              </View>
              {content.blockers.rows.map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.cellWide]}>{r.description || "—"}</Text>
                  <Text style={styles.cell}>{r.owner || "—"}</Text>
                  <Text style={[styles.cell, { color: "#6b7280" }]}>{r.impact || "—"}</Text>
                  <Text
                    style={[
                      styles.cell,
                      {
                        color:
                          r.status === "bloqueado"
                            ? "#dc2626"
                            : r.status === "en_progreso"
                              ? "#ca8a04"
                              : "#16a34a",
                      },
                    ]}
                  >
                    {r.status === "bloqueado"
                      ? "Bloqueado"
                      : r.status === "en_progreso"
                        ? "En progreso"
                        : "Abierto"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Decisiones ── */}
        {hasDecisions && (
          <View style={styles.section}>
            <SectionTitle>Decisiones</SectionTitle>
            {content.decisions.rows
              .filter((r) => r.status !== "cerrada")
              .map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.cellNarrow, { color: "#ca8a04" }]}>
                    {r.status === "escalada" ? "Escalada" : "Pendiente"}
                  </Text>
                  <Text style={[styles.cell, styles.cellWide]}>{r.description || "—"}</Text>
                  <Text style={styles.cell}>{r.owner || "—"}</Text>
                  <Text style={[styles.cell, styles.cellNarrow, { fontFamily: "Courier" }]}>
                    {r.deadline || "—"}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* ── Foco proxima semana ── */}
        {hasNextFocus && (
          <View style={styles.section}>
            <SectionTitle>Foco proxima semana</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cellHeader, styles.cellNarrow]}>Prior.</Text>
                <Text style={styles.cellHeader}>Responsable</Text>
                <Text style={[styles.cellHeader, styles.cellWide]}>Objetivo</Text>
                <Text style={[styles.cellHeader, styles.cellWide]}>Output</Text>
              </View>
              {content.nextFocus.rows.map((r) => (
                <View key={r.id} style={styles.tableRow}>
                  <Text
                    style={[
                      styles.cell,
                      styles.cellNarrow,
                      {
                        color:
                          r.priority === "alta"
                            ? "#dc2626"
                            : r.priority === "baja"
                              ? "#16a34a"
                              : "#ca8a04",
                      },
                    ]}
                  >
                    {r.priority === "alta" ? "Alta" : r.priority === "baja" ? "Baja" : "Media"}
                  </Text>
                  <Text style={styles.cell}>{r.owner || "—"}</Text>
                  <Text style={[styles.cell, styles.cellWide]}>{r.objective || "—"}</Text>
                  <Text style={[styles.cell, styles.cellWide, { color: "#6b7280" }]}>
                    {r.output || "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </Page>

      {/* ── Página 2: Secciones operativas + Performance ── */}
      {(hasCfg || hasEnvios || hasSoporte || hasCajones || hasPerf || hasMarco) && (
        <Page size="A4" style={styles.page}>

          {/* ── Activaciones ── */}
          {hasCfg && (
            <View style={styles.section}>
              <SectionTitle>Activaciones (Guille)</SectionTitle>
              <View style={styles.metricGrid}>
                {content.configuraciones.totalConfigs !== null && (
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Total</Text>
                    <Text style={styles.metricValue}>{content.configuraciones.totalConfigs}</Text>
                  </View>
                )}
                {content.configuraciones.successRate1st !== null && (
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Exito 1a config</Text>
                    <Text style={styles.metricValue}>
                      {content.configuraciones.successRate1st}%
                    </Text>
                  </View>
                )}
                {content.configuraciones.successRate2nd !== null && (
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Exito 2a config</Text>
                    <Text style={styles.metricValue}>
                      {content.configuraciones.successRate2nd}%
                    </Text>
                  </View>
                )}
              </View>
              {content.configuraciones.techBreakdown.length > 0 && (
                <>
                  <SubTitle>Breakdown por tecnico</SubTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={styles.cellHeader}>Tecnico</Text>
                      <Text style={[styles.cellHeader, styles.cellNarrow]}>Cantidad</Text>
                      <Text style={[styles.cellHeader, styles.cellNarrow]}>Avg (min)</Text>
                      <Text style={[styles.cellHeader, styles.cellNarrow]}>Exito (%)</Text>
                    </View>
                    {content.configuraciones.techBreakdown.map((r) => (
                      <View key={r.id} style={styles.tableRow}>
                        <Text style={styles.cell}>{r.technician || "—"}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{r.count ?? "—"}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{r.avgMinutes ?? "—"}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{r.successRate ?? "—"}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {content.configuraciones.problems && (
                <Text style={[styles.paragraph, { marginTop: 6, color: "#6b7280" }]}>
                  {content.configuraciones.problems}
                </Text>
              )}
              <DeptExtrasBlock
                highlights={content.configuraciones.highlights}
                blockers={content.configuraciones.blockers}
              />
            </View>
          )}

          {/* ── Envios ── */}
          {hasEnvios && (
            <View style={styles.section}>
              <SectionTitle>Envios y Logistica (Domi)</SectionTitle>
              <View style={styles.metricGrid}>
                {([
                  ["Total ops", content.envios.totalOps],
                  ["Completadas", content.envios.completed],
                  ["Enviadas", content.envios.shipped],
                  ["Pendientes", content.envios.pending],
                  ["SLA 7d (%)", content.envios.sla7dPct],
                  ["Plazo medio (d)", content.envios.avgDeliveryDays],
                ] as [string, number | null][]).filter(([, v]) => v !== null).map(([label, value]) => (
                  <View key={label} style={styles.metricBox}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <Text style={styles.metricValue}>{value}</Text>
                  </View>
                ))}
              </View>
              {content.envios.orders.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.cellHeader, styles.cellWide]}>Venue</Text>
                    <Text style={styles.cellHeader}>Estado</Text>
                    <Text style={[styles.cellHeader, styles.cellWide]}>Notas</Text>
                  </View>
                  {content.envios.orders.map((r) => (
                    <View key={r.id} style={styles.tableRow}>
                      <Text style={[styles.cell, styles.cellWide]}>{r.venue || "—"}</Text>
                      <Text style={styles.cell}>{r.status}</Text>
                      <Text style={[styles.cell, styles.cellWide, { color: "#6b7280" }]}>
                        {r.notes || "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <DeptExtrasBlock highlights={content.envios.highlights} blockers={content.envios.blockers} />
            </View>
          )}

          {/* ── Soporte ── */}
          {hasSoporte && (
            <View style={styles.section}>
              <SectionTitle>Soporte HW (Domi)</SectionTitle>
              <View style={styles.metricGrid}>
                {([
                  ["Incidencias abiertas", content.soporte.openIncidents],
                  ["Incidencias >7d", content.soporte.incidentsOver7d],
                  ["RMAs activos", content.soporte.activeRmas],
                  ["SLA cumpl. (%)", content.soporte.sla7dPct],
                  ["Criticas en SLA (%)", content.soporte.criticalInSlaPct],
                  ["Reapertura (%)", content.soporte.reopenRatePct],
                  ["Resolucion (h)", content.soporte.avgResolutionHours],
                  ["Turnaround RMA (d)", content.soporte.avgRmaTurnaroundDays],
                ] as [string, number | null][]).filter(([, v]) => v !== null).map(([label, value]) => (
                  <View key={label} style={styles.metricBox}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <Text style={styles.metricValue}>{value}</Text>
                  </View>
                ))}
              </View>
              {hasDoc(content.soporte.narrative) && (
                <TiptapBlock doc={content.soporte.narrative} />
              )}
              {content.soporte.incidents.length > 0 && (
                <>
                  <SubTitle>Incidencias destacadas</SubTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={styles.cellHeader}>Cliente</Text>
                      <Text style={[styles.cellHeader, styles.cellNarrow]}>Prioridad</Text>
                      <Text style={styles.cellHeader}>Estado</Text>
                      <Text style={[styles.cellHeader, styles.cellNarrow]}>Dias</Text>
                      <Text style={[styles.cellHeader, styles.cellWide]}>Comentario</Text>
                    </View>
                    {content.soporte.incidents.map((r) => (
                      <View key={r.id} style={styles.tableRow}>
                        <Text style={styles.cell}>{r.customer || "—"}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{r.priority}</Text>
                        <Text style={styles.cell}>{r.status || "—"}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{r.daysOpen ?? "—"}</Text>
                        <Text style={[styles.cell, styles.cellWide, { color: "#6b7280" }]}>
                          {r.comment || "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {content.soporte.rmas.length > 0 && (
                <>
                  <SubTitle>RMAs activos</SubTitle>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={styles.cellHeader}>Proveedor</Text>
                      <Text style={styles.cellHeader}>Dispositivo</Text>
                      <Text style={styles.cellHeader}>Estado</Text>
                      <Text style={[styles.cellHeader, styles.cellNarrow]}>Dias</Text>
                      <Text style={[styles.cellHeader, styles.cellWide]}>Notas</Text>
                    </View>
                    {content.soporte.rmas.map((r) => (
                      <View key={r.id} style={styles.tableRow}>
                        <Text style={styles.cell}>{r.provider || "—"}</Text>
                        <Text style={styles.cell}>{r.device || "—"}</Text>
                        <Text style={styles.cell}>{r.status || "—"}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{r.daysOpen ?? "—"}</Text>
                        <Text style={[styles.cell, styles.cellWide, { color: "#6b7280" }]}>
                          {r.notes || "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              <DeptExtrasBlock highlights={content.soporte.highlights} blockers={content.soporte.blockers} />
            </View>
          )}

          {/* ── Cajones ── */}
          {hasCajones && (
            <View style={styles.section}>
              <SectionTitle>Cajones inteligentes (JJ)</SectionTitle>
              {content.cajones.rows.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.cellHeader, styles.cellWide]}>Cliente</Text>
                    <Text style={styles.cellHeader}>Estado</Text>
                    <Text style={styles.cellHeader}>Proveedor</Text>
                    <Text style={[styles.cellHeader, styles.cellWide]}>Notas</Text>
                    <Text style={[styles.cellHeader, styles.cellNarrow]}>MRR (EUR)</Text>
                  </View>
                  {content.cajones.rows.map((r) => (
                    <View key={r.id} style={styles.tableRow}>
                      <Text style={[styles.cell, styles.cellWide]}>{r.client || "—"}</Text>
                      <Text style={styles.cell}>{r.status || "—"}</Text>
                      <Text style={styles.cell}>{r.provider || "—"}</Text>
                      <Text style={[styles.cell, styles.cellWide, { color: "#6b7280" }]}>
                        {r.notes || "—"}
                      </Text>
                      <Text style={[styles.cell, styles.cellNarrow]}>
                        {r.mrr != null ? r.mrr.toLocaleString("es-ES") : "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <DeptExtrasBlock highlights={content.cajones.highlights} blockers={content.cajones.blockers} />
            </View>
          )}

          {/* ── Marco Informe ── */}
          {hasMarco && (
            <View style={styles.section}>
              <SectionTitle>Marco Informe</SectionTitle>
              {hasDoc(content.marco.narrative) && <TiptapBlock doc={content.marco.narrative} />}
              <DeptExtrasBlock highlights={content.marco.highlights} blockers={content.marco.blockers} />
            </View>
          )}

          {/* ── Performance ── */}
          {hasPerf && (
            <View style={styles.section}>
              <SectionTitle>Performance del equipo</SectionTitle>
              {content.performance.members
                .filter((m) => m.kpis.length > 0 || hasDoc(m.narrative))
                .map((m) => (
                  <View key={m.member} style={{ marginBottom: 10 }}>
                    <SubTitle>{m.displayName}</SubTitle>
                    {m.kpis.length > 0 && (
                      <View style={styles.table}>
                        <View style={styles.tableHeaderRow}>
                          <Text style={[styles.cellHeader, styles.cellWide]}>KPI</Text>
                          <Text style={[styles.cellHeader, styles.cellNarrow]}>Valor</Text>
                          <Text style={[styles.cellHeader, styles.cellNarrow]}>Target</Text>
                          <Text style={[styles.cellHeader, styles.cellNarrow]}>Estado</Text>
                        </View>
                        {m.kpis.map((k) => (
                          <View key={k.id} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.cellWide]}>{k.label || "—"}</Text>
                            <Text style={[styles.cell, styles.cellNarrow]}>{k.value || "—"}</Text>
                            <Text style={[styles.cell, styles.cellNarrow]}>{k.target || "—"}</Text>
                            <Text
                              style={[
                                styles.cell,
                                styles.cellNarrow,
                                { color: statusColor(k.status) },
                              ]}
                            >
                              {statusText(k.status)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {hasDoc(m.narrative) && (
                      <View style={{ marginTop: 4 }}>
                        <TiptapBlock doc={m.narrative} />
                      </View>
                    )}
                  </View>
                ))}
            </View>
          )}

        </Page>
      )}
    </Document>
  );
}
