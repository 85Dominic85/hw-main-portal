import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import type { WeeklySummary } from "@/lib/bitacora/weekly-summary";
import { authorDisplayName } from "@/lib/bitacora/weekly-summary";
import { entryHeading } from "@/lib/bitacora/to-markdown";
import { tagLabel } from "@/lib/bitacora/tags";
import { formatDayLabel } from "@/lib/bitacora/work-week";

/**
 * Recopilatorio semanal en PDF.
 *
 * Misma estructura que el resto de salidas: scorecard arriba, diario debajo.
 * Fuentes Helvetica (las que trae @react-pdf/renderer sin registrar nada) y
 * paleta en hex, porque el PDF no tiene tokens CSS ni tema del visor.
 */

const C = {
  ink: "#1a1a1a",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e5e7eb",
  ok: "#15803d",
  warn: "#b45309",
  bg: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.45,
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 52,
    paddingRight: 52,
    color: C.ink,
  },
  header: { marginBottom: 18, borderBottom: `1.5px solid ${C.line}`, paddingBottom: 12 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  period: { fontSize: 10, color: C.muted },

  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 16,
  },

  tileRow: { flexDirection: "row", gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: C.bg,
    border: `1px solid ${C.line}`,
    borderRadius: 4,
    padding: 8,
  },
  tileLabel: { fontSize: 6.5, color: C.faint, letterSpacing: 0.5, marginBottom: 2 },
  tileValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  tileFoot: { fontSize: 7, color: C.muted, marginTop: 2 },

  bulletRow: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 8, color: C.faint },
  bulletText: { flex: 1, fontSize: 9 },

  dayHeading: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: `0.5px solid ${C.line}`,
  },

  entry: { marginBottom: 9, paddingLeft: 8, borderLeft: `1.5px solid ${C.line}` },
  entryHighlighted: { borderLeft: `1.5px solid ${C.warn}` },
  entryTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  entryMeta: { fontSize: 7.5, color: C.muted, marginTop: 1 },
  entryBody: { fontSize: 9, color: "#374151", marginTop: 2 },
  entryTags: { fontSize: 7, color: C.faint, marginTop: 2 },

  empty: { fontSize: 9, color: C.muted, fontStyle: "italic", marginTop: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    fontSize: 7,
    color: C.faint,
    textAlign: "center",
  },
});

const STATUS_LABEL: Record<string, string> = {
  abierta: "Abierta",
  resuelta: "Resuelta",
  seguimiento: "En seguimiento",
};

export interface BitacoraPdfProps {
  summary: WeeklySummary;
}

export function BitacoraPdfDocument({ summary }: BitacoraPdfProps) {
  const { totals } = summary;
  const days = summary.byWorkDay.filter((d) => d.entries.length > 0);

  return (
    <Document
      title={`Bitácora ${summary.label}`}
      author="HW Main Portal"
      subject="Recopilatorio semanal de la bitácora del departamento de Hardware"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Bitácora del departamento</Text>
          <Text style={styles.period}>{summary.label}</Text>
        </View>

        {/* ── Scorecard ───────────────────────────────────────────────── */}
        <View style={styles.tileRow}>
          <Tile
            label="ENTRADAS REGISTRADAS"
            value={String(totals.entries)}
            foot={`${totals.perWorkDay.toLocaleString("es-ES")} al día laborable`}
          />
          <Tile
            label="CON ESTADO"
            value={String(totals.incidents.total)}
            foot={
              totals.incidents.total === 0
                ? "Nadie marcó estado"
                : `${totals.incidents.resueltas} resueltas · ${totals.incidents.abiertas} abiertas`
            }
          />
          <Tile
            label="CLIENTES"
            value={String(totals.clients)}
            foot={summary.clients.slice(0, 2).join(", ") || "Ninguno anotado"}
          />
          <Tile
            label="AUTORES"
            value={String(totals.authors.length)}
            foot={totals.authors.map((a) => `${a.name} ${a.entries}`).join(" · ")}
          />
        </View>

        <Text style={styles.sectionTitle}>RESUMEN DE LA SEMANA</Text>
        <Bullet>
          Actividad:{" "}
          {summary.byWorkDay.map((d) => `${d.label} ${d.entries.length}`).join(" · ")}
        </Bullet>
        {summary.tagRanking.length > 0 && (
          <Bullet>
            Dónde se fue la semana:{" "}
            {summary.tagRanking
              .slice(0, 6)
              .map((t) => `${tagLabel(t.tag)} (${t.count})`)
              .join(", ")}
          </Bullet>
        )}
        {summary.offHours.length > 0 && (
          <Bullet>
            Fuera de horario: {summary.offHours.length}{" "}
            {summary.offHours.length === 1 ? "entrada" : "entradas"} en fin de semana
          </Bullet>
        )}

        {/* ── Lo que hay que mirar ────────────────────────────────────── */}
        {summary.highlights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>LO QUE HAY QUE MIRAR</Text>
            {summary.highlights.map((entry) => (
              <PdfEntry key={entry.id} entry={entry} showDate />
            ))}
          </>
        )}

        {/* ── Sigue abierto ───────────────────────────────────────────── */}
        {summary.openItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SIGUE ABIERTO</Text>
            {summary.openItems.map((entry) => (
              <Bullet key={entry.id}>
                {entryHeading(entry)}
                {entry.client?.trim() ? ` — ${entry.client.trim()}` : ""}
              </Bullet>
            ))}
          </>
        )}

        {/* ── Diario ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>DIARIO DE LA SEMANA</Text>

        {totals.entries === 0 && (
          <Text style={styles.empty}>No se registró ninguna entrada esta semana.</Text>
        )}

        {days.map((day) => (
          <View key={day.dateKey} wrap={false}>
            <Text style={styles.dayHeading}>
              {capitalize(formatDayLabel(day.dateKey))}
            </Text>
            {day.entries.map((entry) => (
              <PdfEntry key={entry.id} entry={entry} />
            ))}
          </View>
        ))}

        {summary.offHours.length > 0 && (
          <>
            <Text style={styles.dayHeading}>Fuera de horario</Text>
            {summary.offHours.map((entry) => (
              <PdfEntry key={entry.id} entry={entry} showDate />
            ))}
          </>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `HW Main Portal · Bitácora ${summary.label} · ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

/* ── Piezas ──────────────────────────────────────────────────────────────── */

function Tile({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileFoot}>{foot}</Text>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>·</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function PdfEntry({ entry, showDate }: { entry: LogEntryRow; showDate?: boolean }) {
  const hasTitle = Boolean(entry.title?.trim());
  const meta = [
    authorDisplayName(entry),
    showDate ? capitalize(formatDayLabel(String(entry.entryDate).slice(0, 10))) : null,
    entry.client?.trim() || null,
    entry.status ? STATUS_LABEL[entry.status] ?? entry.status : null,
  ].filter(Boolean);

  return (
    <View style={[styles.entry, ...(entry.highlight ? [styles.entryHighlighted] : [])]}>
      {hasTitle && <Text style={styles.entryTitle}>{entry.title!.trim()}</Text>}
      {meta.length > 0 && <Text style={styles.entryMeta}>{meta.join(" · ")}</Text>}
      {/* Sin título el cuerpo es el contenido principal, y va completo: poner
          solo su primera línea perdería el resto de la entrada. */}
      {entry.bodyText ? (
        <Text style={hasTitle ? styles.entryBody : styles.entryTitle}>
          {entry.bodyText}
        </Text>
      ) : (
        !hasTitle && <Text style={styles.entryTitle}>{entryHeading(entry)}</Text>
      )}
      {(entry.tags ?? []).length > 0 && (
        <Text style={styles.entryTags}>
          {entry.tags.map((t) => tagLabel(t)).join(" · ")}
        </Text>
      )}
    </View>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
