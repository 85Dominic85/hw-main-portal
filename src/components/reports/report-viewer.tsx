import type { ReactNode } from "react";

import { TiptapContent } from "./tiptap-content";
import type { ReportContent, KpiSnapshot } from "@/lib/reports/schema";
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
}

export function ReportViewer({ report, content, snapshot }: ReportViewerProps) {
  const hasDoc = (doc: { content?: unknown[] }) =>
    Array.isArray(doc.content) && doc.content.length > 0;

  const fechaEntrega = report.publishedAt
    ? new Date(report.publishedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Borrador";

  const c = content;

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
      {hasDoc(c.tesis.doc) && (
        <Callout emoji="🎯" title="Tesis de la semana">
          <TiptapContent doc={c.tesis.doc} className="prose prose-sm max-w-none dark:prose-invert" />
        </Callout>
      )}

      {/* 🚦 Resumen ejecutivo */}
      {c.executiveSummary.rows.length > 0 && (
        <Section emoji="🚦" title="Resumen ejecutivo" subtitle="Lectura rápida para Pablo. El detalle de cada semáforo no verde está más abajo.">
          <NotionTable head={["KPI", "Target", "Actual", "Δ vs anterior", "Semáforo", "Comentario"]} center={[4]}>
            {c.executiveSummary.rows.map((row) => (
              <tr key={row.id}>
                <Td className="font-medium">{row.label || "—"}</Td>
                <Td>{row.target || "—"}</Td>
                <Td>{row.actual || "—"}</Td>
                <Td>{row.delta || "—"}</Td>
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

      {/* ✅ Highlights */}
      {hasDoc(c.highlights.doc) && (
        <Section emoji="✅" title="Highlights de la semana">
          <TiptapContent doc={c.highlights.doc} className="prose prose-sm max-w-none dark:prose-invert" />
        </Section>
      )}

      {/* 🚧 Bloqueos */}
      {c.blockers.rows.length > 0 && (
        <Section emoji="🚧" title="Bloqueos abiertos">
          <NotionTable head={["Bloqueo", "Owner", "Impacto", "Estado"]}>
            {c.blockers.rows.map((row) => (
              <tr key={row.id}>
                <Td>{row.description || "—"}</Td>
                <Td className="font-medium">{row.owner || "—"}</Td>
                <Td className="text-muted-foreground">{row.impact || "—"}</Td>
                <Td><StatusChip status={row.status} /></Td>
              </tr>
            ))}
          </NotionTable>
        </Section>
      )}

      {/* 🔴 Decisiones */}
      {c.decisions.rows.length > 0 && (
        <Section emoji="🔴" title="Decisiones pendientes">
          <NotionTable head={["Decisión", "Owner", "Estado", "Fecha", "Resolución"]}>
            {c.decisions.rows.map((row) => (
              <tr key={row.id}>
                <Td>{row.description || "—"}</Td>
                <Td className="font-medium">{row.owner || "—"}</Td>
                <Td><StatusChip status={row.status} /></Td>
                <Td className="whitespace-nowrap">{row.deadline || "—"}</Td>
                <Td className="text-muted-foreground">{row.resolution || "—"}</Td>
              </tr>
            ))}
          </NotionTable>
        </Section>
      )}

      {/* 🛠 Áreas operativas */}
      {(hasOperativas(c)) && (
        <Section emoji="🛠" title="Áreas operativas">
          {/* 1. Configuraciones */}
          {(c.configuraciones.totalConfigs != null ||
            c.configuraciones.techBreakdown.length > 0 ||
            c.configuraciones.problems) && (
            <SubSection title="1. Configuraciones">
              <MetricTable
                rows={[
                  ["Total registros", c.configuraciones.totalConfigs],
                  ["% éxito 1ª config", pct(c.configuraciones.successRate1st)],
                  ["% requieren 2ª config", pct(c.configuraciones.successRate2nd)],
                ]}
              />
              {c.configuraciones.techBreakdown.length > 0 && (
                <NotionTable head={["Técnico", "Configs", "Min. prom.", "% éxito"]} center={[1, 2, 3]}>
                  {c.configuraciones.techBreakdown.map((row) => (
                    <tr key={row.id}>
                      <Td className="font-medium">{row.technician || "—"}</Td>
                      <Td center>{row.count ?? "—"}</Td>
                      <Td center>{row.avgMinutes ?? "—"}</Td>
                      <Td center>{pct(row.successRate) ?? "—"}</Td>
                    </tr>
                  ))}
                </NotionTable>
              )}
              {c.configuraciones.problems && (
                <p className="mt-3 text-sm text-muted-foreground">{c.configuraciones.problems}</p>
              )}
            </SubSection>
          )}

          {/* 2. Envíos */}
          {(c.envios.totalOps != null || c.envios.orders.length > 0 || c.envios.coveragePnp) && (
            <SubSection title="2. Envíos · Logística · Stock">
              <MetricTable
                rows={[
                  ["Operaciones registradas", c.envios.totalOps],
                  ["Completados", c.envios.completed],
                  ["Enviados", c.envios.shipped],
                  ["Pendientes / Nuevos", c.envios.pending],
                  ["Facturación bruta", eur(c.envios.grossRevenue)],
                  ["Margen operativo HW (est.)", eur(c.envios.marginEur)],
                  ["Plazo medio entrega", c.envios.avgDeliveryDays != null ? `${c.envios.avgDeliveryDays} días` : null],
                  ["Cumplimiento SLA 7d", pct(c.envios.sla7dPct)],
                  ["Cobertura PnP en envíos", c.envios.coveragePnp || null],
                  ["Oficina vs proveedor", c.envios.officeVsProvider || null],
                ]}
              />
              {c.envios.orders.length > 0 && (
                <NotionTable head={["Local", "Estado", "Notas"]}>
                  {c.envios.orders.map((row) => (
                    <tr key={row.id}>
                      <Td className="font-medium">{row.venue || "—"}</Td>
                      <Td><StatusChip status={row.status} /></Td>
                      <Td className="text-muted-foreground">{row.notes || "—"}</Td>
                    </tr>
                  ))}
                </NotionTable>
              )}
            </SubSection>
          )}

          {/* 3. Soporte HW */}
          {(c.soporte.openIncidents != null || c.soporte.rmas.length > 0 || hasDoc(c.soporte.narrative)) && (
            <SubSection title="3. Soporte HW">
              <MetricTable
                rows={[
                  ["Incidencias abiertas", c.soporte.openIncidents],
                  ["RMAs activos", c.soporte.activeRmas],
                  ["SLA 7d", pct(c.soporte.sla7dPct)],
                  ["SLA 30d", pct(c.soporte.sla30dPct)],
                  ["Tasa reapertura", pct(c.soporte.reopenRatePct)],
                  ["Resolución media", c.soporte.avgResolutionHours != null ? `${c.soporte.avgResolutionHours}h` : null],
                  ["RMA respuesta <2h", pct(c.soporte.rmaResponseUnder2hPct)],
                ]}
              />
              {c.soporte.rmas.length > 0 && (
                <NotionTable head={["Proveedor", "Dispositivo", "Estado", "Días", "Notas"]} center={[3]}>
                  {c.soporte.rmas.map((row) => (
                    <tr key={row.id}>
                      <Td className="font-medium">{row.provider || "—"}</Td>
                      <Td>{row.device || "—"}</Td>
                      <Td>{row.status || "—"}</Td>
                      <Td center>{row.daysOpen ?? "—"}</Td>
                      <Td className="text-muted-foreground">{row.notes || "—"}</Td>
                    </tr>
                  ))}
                </NotionTable>
              )}
              {hasDoc(c.soporte.narrative) && (
                <div className="mt-3">
                  <TiptapContent doc={c.soporte.narrative} className="prose prose-sm max-w-none dark:prose-invert" />
                </div>
              )}
            </SubSection>
          )}

          {/* 4. Cajones inteligentes */}
          {c.cajones.rows.length > 0 && (
            <SubSection title="4. Cajones inteligentes">
              <NotionTable head={["Cliente", "Estado", "Proveedor", "MRR", "Notas"]} center={[3]}>
                {c.cajones.rows.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium">{row.client || "—"}</Td>
                    <Td>{row.status || "—"}</Td>
                    <Td>{row.provider || "—"}</Td>
                    <Td center>{eur(row.mrr) ?? "—"}</Td>
                    <Td className="text-muted-foreground">{row.notes || "—"}</Td>
                  </tr>
                ))}
              </NotionTable>
            </SubSection>
          )}
        </Section>
      )}

      {/* 👥 Performance */}
      {c.performance.members.some((m) => m.kpis.length > 0 || hasDoc(m.narrative)) && (
        <Section emoji="👥" title="Performance del equipo">
          <div className="space-y-6">
            {c.performance.members.map((member) => {
              if (!member.kpis.length && !hasDoc(member.narrative)) return null;
              return (
                <div key={member.member}>
                  <p className="mb-2 text-base font-bold">{member.displayName}</p>
                  {member.kpis.length > 0 && (
                    <NotionTable head={["KPI", "Target", "Actual", "Semáforo"]} center={[3]}>
                      {member.kpis.map((kpi) => (
                        <tr key={kpi.id}>
                          <Td>{kpi.label || "—"}</Td>
                          <Td>{kpi.target || "—"}</Td>
                          <Td>{kpi.value || "—"}</Td>
                          <Td center>
                            <Dot status={kpi.status} />
                          </Td>
                        </tr>
                      ))}
                    </NotionTable>
                  )}
                  {hasDoc(member.narrative) && (
                    <div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
                      <TiptapContent doc={member.narrative} className="prose prose-sm max-w-none dark:prose-invert" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 📌 Foco próxima semana */}
      {c.nextFocus.rows.length > 0 && (
        <Section emoji="📌" title="Foco próxima semana">
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

      {/* 💬 Comentarios Pablo */}
      {hasDoc(c.pabloComments.doc) && (
        <Section emoji="💬" title="Comentarios Pablo">
          <TiptapContent doc={c.pabloComments.doc} className="prose prose-sm max-w-none dark:prose-invert" />
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

function pct(v: number | null | undefined): string | null {
  return v == null ? null : `${v}%`;
}

function eur(v: number | null | undefined): string | null {
  return v == null ? null : v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function hasOperativas(c: ReportContent): boolean {
  return (
    c.configuraciones.totalConfigs != null ||
    c.configuraciones.techBreakdown.length > 0 ||
    !!c.configuraciones.problems ||
    c.envios.totalOps != null ||
    c.envios.orders.length > 0 ||
    !!c.envios.coveragePnp ||
    c.soporte.openIncidents != null ||
    c.soporte.rmas.length > 0 ||
    (Array.isArray(c.soporte.narrative.content) && c.soporte.narrative.content.length > 0) ||
    c.cajones.rows.length > 0
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

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {children}
    </div>
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

function MetricTable({ rows }: { rows: Array<[string, ReactNode]> }) {
  const visible = rows.filter(([, v]) => v != null && v !== "");
  if (!visible.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-xl border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th className="w-1/2 border border-border bg-muted/50 px-3 py-2 text-left font-semibold text-muted-foreground">Métrica</th>
            <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold text-muted-foreground">Valor</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(([label, value]) => (
            <tr key={label}>
              <td className="border border-border px-3 py-2 text-muted-foreground">{label}</td>
              <td className="border border-border px-3 py-2 tabular-nums">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    abierto: "bg-yellow-100 text-yellow-800",
    en_progreso: "bg-blue-100 text-blue-800",
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
      {status.replace(/_/g, " ")}
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
