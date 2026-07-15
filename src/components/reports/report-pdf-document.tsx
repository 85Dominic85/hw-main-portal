import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type {
  ReportContent,
  KpiSnapshot,
  TiptapDoc,
  Highlights,
  Blockers,
  MemberSection,
} from "@/lib/reports/schema";

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

function memberHasContent(m: MemberSection): boolean {
  return m.kpisPersonales.length > 0 || hasExtras(m);
}

function MemberPdfSection({ title, data }: { title: string; data: MemberSection }) {
  if (!memberHasContent(data)) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {data.kpisPersonales.length > 0 && (
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellHeader, styles.cellWide]}>KPI</Text>
            <Text style={styles.cellHeader}>Valor</Text>
            <Text style={styles.cellHeader}>Target</Text>
            <Text style={[styles.cellHeader, styles.cellNarrow]}>Estado</Text>
          </View>
          {data.kpisPersonales.map((k) => (
            <View key={k.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.cellWide]}>{k.label || "—"}</Text>
              <Text style={styles.cell}>{k.value || "—"}</Text>
              <Text style={styles.cell}>{k.target || "—"}</Text>
              <Text style={[styles.cell, styles.cellNarrow, { color: statusColor(k.status) }]}>
                {statusText(k.status)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <DeptExtrasBlock highlights={data.highlights} blockers={data.blockers} />
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
  /** Si false, se omite la sección Performance (exportador ≠ jj.gallego). */
  showPerformance?: boolean;
}

export function ReportPdfDocument({ report, content, showPerformance = false }: Props) {
  const hasExecutiveSummary = content.executiveSummary.rows.length > 0;
  const hasAmberRed = content.amberRed.rows.length > 0;
  const hasMarco = memberHasContent(content.marco);
  const hasDomingo = memberHasContent(content.domingo);
  const hasGuillermo = memberHasContent(content.guillermo);
  const hasPerf =
    showPerformance && content.performance.members.some((m) => hasDoc(m.narrative));
  const hasIdStatus = hasDoc(content.idStatus.doc);
  const hasNextFocus = content.nextFocus.rows.length > 0;

  const hasPage2 =
    hasMarco || hasDomingo || hasGuillermo || hasPerf || hasIdStatus || hasNextFocus;

  return (
    <Document title={report.title} author="HW Main Portal" subject={report.periodLabel}>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          {content.author ? <Text style={styles.period}>Autor: {content.author}</Text> : null}
          <Text style={styles.period}>{report.periodLabel}</Text>
          {report.globalStatus && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor(report.globalStatus) }]}>
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

        {/* ── KPIs generales ── */}
        {hasExecutiveSummary && (
          <View style={styles.section}>
            <SectionTitle>KPIs generales</SectionTitle>
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
                  <Text style={[styles.cell, styles.cellNarrow, { color: statusColor(r.status) }]}>
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
      </Page>

      {/* ── Página 2: Secciones por persona + Performance + I+D + Foco ── */}
      {hasPage2 && (
        <Page size="A4" style={styles.page}>
          <MemberPdfSection title="Marco" data={content.marco} />
          <MemberPdfSection title="Domingo" data={content.domingo} />
          <MemberPdfSection title="Guillermo" data={content.guillermo} />

          {/* ── Performance (solo jj) ── */}
          {hasPerf && (
            <View style={styles.section}>
              <SectionTitle>Performance del equipo</SectionTitle>
              {content.performance.members.map((m) => (
                <View key={m.member} style={{ marginBottom: 10 }}>
                  <SubTitle>{m.displayName}</SubTitle>
                  {hasDoc(m.narrative) && <TiptapBlock doc={m.narrative} />}
                </View>
              ))}
            </View>
          )}

          {/* ── I+D status WIP ── */}
          {hasIdStatus && (
            <View style={styles.section}>
              <SectionTitle>I+D status WIP</SectionTitle>
              <TiptapBlock doc={content.idStatus.doc} />
            </View>
          )}

          {/* ── Foco del mes / semana ── */}
          {hasNextFocus && (
            <View style={styles.section}>
              <SectionTitle>Foco del mes / semana</SectionTitle>
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
      )}
    </Document>
  );
}
