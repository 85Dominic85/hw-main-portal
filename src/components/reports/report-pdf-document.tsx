import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type {
  ReportContent,
  KpiSnapshot,
  TiptapDoc,
  Highlights,
  Blockers,
  MemberCommon,
  RndTools,
  Contabilidad,
  AmExperience,
  Rma,
  Kds,
  Cajones,
  QExperience,
} from "@/lib/reports/schema";
import { RMA_ESTADO_LABEL } from "@/lib/reports/labels";

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
  fieldLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 1,
  },
  metricRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  metricTile: {
    flex: 1,
    border: "0.5px solid #e5e7eb",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  metricLabel: { fontSize: 7.5, color: "#6b7280" },
  metricValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 1 },
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

// ── Predicados y sub-bloques por miembro ─────────────────────────────────────

const strHas = (...v: string[]) => v.some((s) => s.trim().length > 0);
const rndHasContent = (t: RndTools) => t.items.some((i) => strHas(i.tool, i.detail));

function commonHasContent(m: MemberCommon): boolean {
  return m.kpisPersonales.length > 0 || rndHasContent(m.toolsRnd) || hasExtras(m);
}
function guillermoHasContent(g: ReportContent["guillermo"]): boolean {
  return (
    commonHasContent(g) ||
    strHas(g.contabilidad.vencimientos, g.contabilidad.facturas, g.contabilidad.reinversion) ||
    strHas(g.amExperience.incidencias, g.amExperience.mejoras)
  );
}
function domingoHasContent(d: ReportContent["domingo"]): boolean {
  return (
    commonHasContent(d) ||
    d.rma.casos.length > 0 ||
    strHas(d.kds.nuevosClientes, d.kds.cambiosUso, d.kds.pendientes)
  );
}
function marcoHasContent(m: ReportContent["marco"]): boolean {
  return (
    commonHasContent(m) ||
    strHas(m.cajones.clientesNuevos, m.cajones.activados, m.cajones.pendientes, m.cajones.mrrNuevo) ||
    hasDoc(m.qExperience.doc)
  );
}

function PdfField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value.split("\n").filter(Boolean).map((line, i) => (
        <Text key={i} style={styles.paragraph}>{line}</Text>
      ))}
    </View>
  );
}

function PdfRndTools({ value }: { value: RndTools }) {
  const items = value.items.filter((i) => strHas(i.tool, i.detail));
  if (items.length === 0) return null;
  return (
    <>
      <SubTitle>Herramientas I+D</SubTitle>
      {items.map((it) => (
        <View key={it.id} style={{ marginBottom: 4 }}>
          <Text style={[styles.paragraph, { fontFamily: "Helvetica-Bold", marginBottom: 1 }]}>
            {it.tool || "—"}
          </Text>
          {it.detail.split("\n").filter(Boolean).map((line, i) => (
            <Text key={i} style={styles.paragraph}>{line}</Text>
          ))}
        </View>
      ))}
    </>
  );
}

function PdfContabilidad({ value }: { value: Contabilidad }) {
  if (!strHas(value.vencimientos, value.facturas, value.reinversion)) return null;
  return (
    <>
      <SubTitle>Contabilidad</SubTitle>
      <PdfField label="Vencimientos" value={value.vencimientos} />
      <PdfField label="Facturas" value={value.facturas} />
      <PdfField label="Reinversion" value={value.reinversion} />
    </>
  );
}

function PdfAmExperience({ value }: { value: AmExperience }) {
  if (!strHas(value.incidencias, value.mejoras)) return null;
  return (
    <>
      <SubTitle>AM Experience</SubTitle>
      <PdfField label="Incidencias" value={value.incidencias} />
      <PdfField label="Mejoras" value={value.mejoras} />
    </>
  );
}

function PdfRma({ value }: { value: Rma }) {
  if (value.casos.length === 0) return null;
  return (
    <>
      <SubTitle>RMA y Proveedores</SubTitle>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.cellHeader, styles.cellWide]}>Caso</Text>
          <Text style={styles.cellHeader}>Estado</Text>
          <Text style={styles.cellHeader}>SLA respuesta</Text>
        </View>
        {value.casos.map((r) => (
          <View key={r.id} style={styles.tableRow}>
            <Text style={[styles.cell, styles.cellWide]}>{r.caso || "—"}</Text>
            <Text style={styles.cell}>{RMA_ESTADO_LABEL[r.estado] ?? r.estado}</Text>
            <Text style={styles.cell}>{r.sla || "—"}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function PdfKds({ value }: { value: Kds }) {
  if (!strHas(value.nuevosClientes, value.cambiosUso, value.pendientes)) return null;
  return (
    <>
      <SubTitle>KDS</SubTitle>
      <PdfField label="Nuevos clientes" value={value.nuevosClientes} />
      <PdfField label="Cambios en el uso general" value={value.cambiosUso} />
      <PdfField label="Pendientes (esta semana / siguiente)" value={value.pendientes} />
    </>
  );
}

function PdfCajones({ value }: { value: Cajones }) {
  const tiles = [
    { label: "Clientes nuevos", value: value.clientesNuevos },
    { label: "Activados", value: value.activados },
    { label: "Pendientes", value: value.pendientes },
    { label: "MRR nuevo actual", value: value.mrrNuevo },
  ];
  if (!tiles.some((t) => t.value.trim())) return null;
  return (
    <>
      <SubTitle>Cajones</SubTitle>
      <View style={styles.metricRow}>
        {tiles.map((t) => (
          <View key={t.label} style={styles.metricTile}>
            <Text style={styles.metricLabel}>{t.label}</Text>
            <Text style={styles.metricValue}>{t.value.trim() || "—"}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function PdfQExperience({ value }: { value: QExperience }) {
  if (!hasDoc(value.doc)) return null;
  return (
    <>
      <SubTitle>Q Experience</SubTitle>
      <TiptapBlock doc={value.doc} />
    </>
  );
}

function MemberKpisTable({ rows }: { rows: MemberCommon["kpisPersonales"] }) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.cellHeader, styles.cellWide]}>KPI</Text>
        <Text style={styles.cellHeader}>Valor</Text>
        <Text style={styles.cellHeader}>Target</Text>
        <Text style={[styles.cellHeader, styles.cellNarrow]}>Estado</Text>
      </View>
      {rows.map((k) => (
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
  );
}

function MemberPdfSection({
  title,
  common,
  children,
}: {
  title: string;
  common: MemberCommon;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <MemberKpisTable rows={common.kpisPersonales} />
      {children}
      <DeptExtrasBlock highlights={common.highlights} blockers={common.blockers} />
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
  const hasMarco = marcoHasContent(content.marco);
  const hasDomingo = domingoHasContent(content.domingo);
  const hasGuillermo = guillermoHasContent(content.guillermo);
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
          {hasGuillermo && (
            <MemberPdfSection title="Guillermo" common={content.guillermo}>
              <PdfRndTools value={content.guillermo.toolsRnd} />
              <PdfContabilidad value={content.guillermo.contabilidad} />
              <PdfAmExperience value={content.guillermo.amExperience} />
            </MemberPdfSection>
          )}
          {hasDomingo && (
            <MemberPdfSection title="Domingo" common={content.domingo}>
              <PdfRndTools value={content.domingo.toolsRnd} />
              <PdfRma value={content.domingo.rma} />
              <PdfKds value={content.domingo.kds} />
            </MemberPdfSection>
          )}
          {hasMarco && (
            <MemberPdfSection title="Marco" common={content.marco}>
              <PdfRndTools value={content.marco.toolsRnd} />
              <PdfCajones value={content.marco.cajones} />
              <PdfQExperience value={content.marco.qExperience} />
            </MemberPdfSection>
          )}

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
