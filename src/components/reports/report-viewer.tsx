import type { ReactNode } from "react";

import { TiptapContent } from "./tiptap-content";
import type {
  ReportContent,
  KpiSnapshot,
  Highlights,
  Blockers,
  MemberCommon,
  PersonalKpiRow,
  RndTools,
  Contabilidad,
  AmExperience,
  Rma,
  Kds,
  Cajones,
  QExperience,
} from "@/lib/reports/schema";
import { canSeePerformance } from "@/lib/reports/report-access";
import { RMA_ESTADO_LABEL, BLOCKER_STATUS_LABEL } from "@/lib/reports/labels";
import { cn } from "@/lib/utils/cn";

// Colores del semáforo (fijos, fieles al informe Notion; válidos en claro y oscuro).
const DOT_COLOR: Record<string, string> = {
  verde: "#4d9e63",
  amarillo: "#d9a93e",
  rojo: "#e0584e",
  neutral: "#b9b7b1",
};

const STATUS_LABEL: Record<string, string> = {
  verde: "Verde",
  amarillo: "Amarillo",
  rojo: "Rojo",
  neutral: "Neutral",
};

interface ReportViewerProps {
  report: {
    id: string;
    title: string;
    type: string;
    periodKey: string;
    periodLabel: string;
    globalStatus: string | null;
    status: string;
    publishedAt: string | null;
  };
  content: ReportContent;
  snapshot: KpiSnapshot | null;
  /** Email del usuario que ve el informe (gate de la sección Performance). */
  currentUserEmail?: string;
}

export function ReportViewer({ report, content, snapshot, currentUserEmail }: ReportViewerProps) {
  const fechaEntrega = report.publishedAt
    ? new Date(report.publishedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Borrador";

  const c = content;
  const canPerf = canSeePerformance(currentUserEmail);
  const hasPerf = c.performance.members.some((m) => hasDocContent(m.narrative));

  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-border bg-card px-6 py-8 text-[15px] leading-relaxed text-foreground sm:px-12 sm:py-10">
      {/* Título */}
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-[34px]">
        {report.title}
      </h1>

      {/* Tabla de propiedades (estilo Notion) */}
      <div className="mb-8 max-w-md overflow-hidden rounded-md border border-border">
        {c.author && (
          <PropRow icon="👤" label="Autor">
            {c.author}
          </PropRow>
        )}
        <PropRow icon="🚦" label="Semáforo">
          {report.globalStatus ? (
            <span className="inline-flex items-center gap-2 rounded bg-muted px-2.5 py-0.5 text-sm font-medium">
              <Dot status={report.globalStatus} />
              {STATUS_LABEL[report.globalStatus] ?? report.globalStatus}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </PropRow>
        <PropRow icon="📅" label="Fecha entrega" last>
          {fechaEntrega}
        </PropRow>
      </div>

      {/* 🎯 Tesis */}
      {hasDocContent(c.tesis.doc) && (
        <Callout emoji="🎯" title="Tesis de la semana">
          <TiptapContent doc={c.tesis.doc} className="prose prose-sm max-w-none dark:prose-invert" />
        </Callout>
      )}

      {/* 🚦 KPIs generales */}
      {c.executiveSummary.rows.length > 0 && (
        <Section emoji="🚦" title="KPIs generales">
          <NotionTable head={["KPI", "Target", "Actual", "Semana anterior", "Owner", "Semáforo", "Comentario"]} center={[5]}>
            {c.executiveSummary.rows.map((row) => (
              <tr key={row.id}>
                <Td className="font-medium">{row.label || "—"}</Td>
                <Td>{row.target || "—"}</Td>
                <Td>{row.actual || "—"}</Td>
                <Td>{row.delta || "—"}</Td>
                <Td className="font-medium">{row.owner || "—"}</Td>
                <Td center>
                  <Dot status={row.status} />
                </Td>
                <Td className="text-muted-foreground">{row.comment || "—"}</Td>
              </tr>
            ))}
          </NotionTable>
        </Section>
      )}

      {/* 🔴🟡 Detalle ámbar / rojo */}
      {c.amberRed.rows.length > 0 && (
        <Section emoji="🔴🟡" title="Detalle semáforos ámbar / rojo">
          <NotionTable head={["Estado", "KPI", "Causa raíz", "Acción en curso", "ETA", "¿Escalación?"]} center={[0]}>
            {c.amberRed.rows.map((row) => (
              <tr key={row.id}>
                <Td center>
                  <Dot status={row.status} />
                </Td>
                <Td className="font-medium">{row.kpi || "—"}</Td>
                <Td className="text-muted-foreground">{row.rootCause || "—"}</Td>
                <Td>{row.action || "—"}</Td>
                <Td className="whitespace-nowrap">{row.eta || "—"}</Td>
                <Td className="text-muted-foreground">{row.escalation || "—"}</Td>
              </tr>
            ))}
          </NotionTable>
        </Section>
      )}

      {/* 🧭 Secciones por persona (orden: KPIs → P1/P2/P3 → Highlights → Bloqueos) */}
      {guillermoHasContent(c.guillermo) && (
        <Section emoji="🧭" title="Guillermo">
          <MemberKpisView rows={c.guillermo.kpisPersonales} />
          <RndToolsView value={c.guillermo.toolsRnd} />
          <ContabilidadView value={c.guillermo.contabilidad} />
          <AmExperienceView value={c.guillermo.amExperience} />
          <DeptExtras highlights={c.guillermo.highlights} blockers={c.guillermo.blockers} />
        </Section>
      )}
      {domingoHasContent(c.domingo) && (
        <Section emoji="🧭" title="Domingo">
          <MemberKpisView rows={c.domingo.kpisPersonales} />
          <RndToolsView value={c.domingo.toolsRnd} />
          <RmaView value={c.domingo.rma} />
          <KdsView value={c.domingo.kds} />
          <DeptExtras highlights={c.domingo.highlights} blockers={c.domingo.blockers} />
        </Section>
      )}
      {marcoHasContent(c.marco) && (
        <Section emoji="🧭" title="Marco">
          <MemberKpisView rows={c.marco.kpisPersonales} />
          <RndToolsView value={c.marco.toolsRnd} />
          <CajonesView value={c.marco.cajones} />
          <QExperienceView value={c.marco.qExperience} />
          <DeptExtras highlights={c.marco.highlights} blockers={c.marco.blockers} />
        </Section>
      )}

      {/* 👥 Performance — solo jj.gallego */}
      {canPerf
        ? hasPerf && (
            <Section emoji="👥" title="Performance del equipo">
              <div className="space-y-4">
                {c.performance.members.map((member) => (
                  <div key={member.member}>
                    <p className="mb-2 text-base font-bold">{member.displayName}</p>
                    {hasDocContent(member.narrative) ? (
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <TiptapContent doc={member.narrative} className="prose prose-sm max-w-none dark:prose-invert" />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )
        : (
            <Section emoji="👥" title="Performance del equipo">
              <p
                className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground"
                title="Solo visible para JJ (jj.gallego@qamarero.com)"
              >
                🔒 Sección restringida — solo visible para JJ.
              </p>
            </Section>
          )}

      {/* 🔬 I+D status WIP */}
      {hasDocContent(c.idStatus.doc) && (
        <Section emoji="🔬" title="I+D status WIP">
          <TiptapContent doc={c.idStatus.doc} className="prose prose-sm max-w-none dark:prose-invert" />
        </Section>
      )}

      {/* 📌 Foco del mes / semana */}
      {c.nextFocus.rows.length > 0 && (
        <Section emoji="📌" title="Foco del mes / semana">
          <NotionTable head={["Prioridad", "Responsable", "Objetivo", "Output esperado"]}>
            {c.nextFocus.rows.map((row) => (
              <tr key={row.id}>
                <Td className="whitespace-nowrap">
                  {row.priority === "alta" ? "🔴 Alta" : row.priority === "media" ? "🟡 Media" : "🟢 Baja"}
                </Td>
                <Td className="font-medium">{row.owner || "—"}</Td>
                <Td>{row.objective || "—"}</Td>
                <Td className="text-muted-foreground">{row.output || "—"}</Td>
              </tr>
            ))}
          </NotionTable>
        </Section>
      )}

      {/* KPI Snapshot — provenance técnica (congelado al publicar) */}
      {snapshot && (
        <div className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              📊 Snapshot KPIs congelado:{" "}
              {new Date(snapshot.frozenAt).toLocaleString("es-ES", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            <HealthChip label="MainOPS" ok={snapshot.sourceHealth.mainops.ok} />
            <HealthChip label="HW Tool" ok={snapshot.sourceHealth.hwtool.ok} />
            <HealthChip label="HSM" ok={snapshot.sourceHealth.hsm.ok} />
          </div>
        </div>
      )}

      {/* Pie */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{report.title}</span>
        <span>{report.status === "published" ? `Publicado ${fechaEntrega}` : "Borrador"}</span>
      </div>
    </article>
  );
}

// ── Helpers de formato ──────────────────────────────────────────────────────

function hasDocContent(doc: { content?: unknown[] }): boolean {
  return Array.isArray(doc.content) && doc.content.length > 0;
}

function deptHasExtras(d: { highlights: Highlights; blockers: Blockers }): boolean {
  return hasDocContent(d.highlights.doc) || d.blockers.rows.length > 0;
}

// ── Predicados de contenido por miembro ──────────────────────────────────────

const strHas = (...v: string[]) => v.some((s) => s.trim().length > 0);
const rndHasContent = (t: RndTools) => t.items.some((i) => strHas(i.tool, i.detail));

function commonHasContent(m: MemberCommon): boolean {
  return m.kpisPersonales.length > 0 || rndHasContent(m.toolsRnd) || deptHasExtras(m);
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
    hasDocContent(m.qExperience.doc)
  );
}

// ── Sub-vistas por bloque ────────────────────────────────────────────────────

function SubHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h3 className="mt-5 flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <span>{emoji}</span>
      {title}
    </h3>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-line text-[14.5px] leading-relaxed">{value}</p>
    </div>
  );
}

function MemberKpisView({ rows }: { rows: PersonalKpiRow[] }) {
  if (rows.length === 0) return null;
  return (
    <NotionTable head={["KPI", "Valor", "Target", "Semáforo"]} center={[3]}>
      {rows.map((row) => (
        <tr key={row.id}>
          <Td className="font-medium">{row.label || "—"}</Td>
          <Td>{row.value || "—"}</Td>
          <Td>{row.target || "—"}</Td>
          <Td center>
            <Dot status={row.status} />
          </Td>
        </tr>
      ))}
    </NotionTable>
  );
}

function RndToolsView({ value }: { value: RndTools }) {
  const items = value.items.filter((i) => strHas(i.tool, i.detail));
  if (items.length === 0) return null;
  return (
    <>
      <SubHeading emoji="🔬" title="Herramientas I+D" />
      <div className="mt-2 space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-sm font-bold">{it.tool || "—"}</p>
            {it.detail.trim() && (
              <p className="mt-0.5 whitespace-pre-line text-[14.5px] leading-relaxed">{it.detail}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ContabilidadView({ value }: { value: Contabilidad }) {
  if (!strHas(value.vencimientos, value.facturas, value.reinversion)) return null;
  return (
    <>
      <SubHeading emoji="💶" title="Contabilidad" />
      <div className="mt-2 space-y-3">
        <FieldBlock label="Vencimientos" value={value.vencimientos} />
        <FieldBlock label="Facturas" value={value.facturas} />
        <FieldBlock label="Reinversión" value={value.reinversion} />
      </div>
    </>
  );
}

function AmExperienceView({ value }: { value: AmExperience }) {
  if (!strHas(value.incidencias, value.mejoras)) return null;
  return (
    <>
      <SubHeading emoji="🎧" title="AM Experience" />
      <div className="mt-2 space-y-3">
        <FieldBlock label="Incidencias" value={value.incidencias} />
        <FieldBlock label="Mejoras" value={value.mejoras} />
      </div>
    </>
  );
}

function RmaView({ value }: { value: Rma }) {
  if (value.casos.length === 0) return null;
  return (
    <>
      <SubHeading emoji="🔧" title="RMA y Proveedores" />
      <div className="mt-2">
        <NotionTable head={["Caso", "Estado", "SLA respuesta"]}>
          {value.casos.map((r) => (
            <tr key={r.id}>
              <Td>{r.caso || "—"}</Td>
              <Td>
                <StatusChip status={r.estado} label={RMA_ESTADO_LABEL[r.estado]} />
              </Td>
              <Td className="whitespace-nowrap">{r.sla || "—"}</Td>
            </tr>
          ))}
        </NotionTable>
      </div>
    </>
  );
}

function KdsView({ value }: { value: Kds }) {
  if (!strHas(value.nuevosClientes, value.cambiosUso, value.pendientes)) return null;
  return (
    <>
      <SubHeading emoji="🖥️" title="KDS" />
      <div className="mt-2 space-y-3">
        <FieldBlock label="Nuevos clientes" value={value.nuevosClientes} />
        <FieldBlock label="Cambios en el uso general" value={value.cambiosUso} />
        <FieldBlock label="Pendientes (esta semana → siguiente)" value={value.pendientes} />
      </div>
    </>
  );
}

function CajonesView({ value }: { value: Cajones }) {
  const tiles = [
    { label: "Clientes nuevos", value: value.clientesNuevos },
    { label: "Activados", value: value.activados },
    { label: "Pendientes", value: value.pendientes },
    { label: "MRR nuevo actual", value: value.mrrNuevo },
  ];
  if (!tiles.some((t) => t.value.trim())) return null;
  return (
    <>
      <SubHeading emoji="📦" title="Cajones" />
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="text-lg font-bold">{t.value.trim() || "—"}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function QExperienceView({ value }: { value: QExperience }) {
  if (!hasDocContent(value.doc)) return null;
  return (
    <>
      <SubHeading emoji="⭐" title="Q Experience" />
      <div className="mt-2">
        <TiptapContent doc={value.doc} className="prose prose-sm max-w-none dark:prose-invert" />
      </div>
    </>
  );
}

function DeptExtras({ highlights, blockers }: { highlights: Highlights; blockers: Blockers }) {
  const hasHl = hasDocContent(highlights.doc);
  const hasBlk = blockers.rows.length > 0;
  if (!hasHl && !hasBlk) return null;
  return (
    <div className="mt-4 space-y-3">
      {hasHl && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Highlights
          </p>
          <TiptapContent doc={highlights.doc} className="prose prose-sm max-w-none dark:prose-invert" />
        </div>
      )}
      {hasBlk && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bloqueos
          </p>
          <NotionTable head={["Bloqueo", "Owner", "Impacto", "Estado"]}>
            {blockers.rows.map((row) => (
              <tr key={row.id}>
                <Td>{row.description || "—"}</Td>
                <Td className="font-medium">{row.owner || "—"}</Td>
                <Td className="text-muted-foreground">{row.impact || "—"}</Td>
                <Td><StatusChip status={row.status} label={BLOCKER_STATUS_LABEL[row.status]} /></Td>
              </tr>
            ))}
          </NotionTable>
        </div>
      )}
    </div>
  );
}

// ── Componentes de presentación ─────────────────────────────────────────────

function Dot({ status }: { status: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full align-middle"
      style={{ backgroundColor: DOT_COLOR[status] ?? DOT_COLOR.neutral }}
      aria-label={STATUS_LABEL[status] ?? status}
    />
  );
}

function PropRow({
  icon,
  label,
  children,
  last,
}: {
  icon: string;
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("flex", !last && "border-b border-border")}>
      <div className="flex w-36 flex-none items-center gap-2 border-r border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
        <span className="opacity-60">{icon}</span>
        {label}
      </div>
      <div className="flex items-center px-3 py-1.5 text-sm">{children}</div>
    </div>
  );
}

function Section({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="flex items-center gap-2.5 text-[22px] font-bold tracking-tight">
        <span>{emoji}</span>
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Callout({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-3 rounded-md bg-muted/50 p-4">
      <div className="w-[3px] flex-none rounded bg-border" />
      <div className="min-w-0 flex-1">
        <h4 className="mb-1.5 flex items-center gap-2 text-[15px] font-bold">
          <span>{emoji}</span>
          {title}
        </h4>
        {children}
      </div>
    </div>
  );
}

function NotionTable({
  head,
  center = [],
  children,
}: {
  head: string[];
  center?: number[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={cn(
                  "border border-border bg-muted/50 px-3 py-2 text-left font-semibold text-muted-foreground",
                  center.includes(i) && "text-center",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({
  children,
  className,
  center,
}: {
  children: ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <td
      className={cn(
        "border border-border px-3 py-2 align-top leading-snug",
        center && "text-center align-middle",
        className,
      )}
    >
      {children}
    </td>
  );
}

function StatusChip({ status, label }: { status: string; label?: string }) {
  const map: Record<string, string> = {
    abierto: "bg-yellow-100 text-yellow-800",
    en_progreso: "bg-blue-100 text-blue-800",
    esperando_proveedor: "bg-orange-100 text-orange-800",
    bloqueado: "bg-red-100 text-red-800",
    pendiente: "bg-yellow-100 text-yellow-800",
    cerrada: "bg-green-100 text-green-800",
    escalada: "bg-red-100 text-red-800",
    completado: "bg-green-100 text-green-800",
    enviado: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

function HealthChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px]",
        ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
      )}
    >
      {label} {ok ? "OK" : "Error"}
    </span>
  );
}
