import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapContent } from "./tiptap-content";
import type { ReportContent, KpiSnapshot } from "@/lib/reports/schema";
import { cn } from "@/lib/utils/cn";

const STATUS_ICON: Record<string, string> = {
  verde: "🟢",
  amarillo: "🟡",
  rojo: "🔴",
  neutral: "—",
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

  return (
    <div className="space-y-6">
      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          Periodo:{" "}
          <span className="font-mono text-foreground">{report.periodLabel}</span>
        </span>
        {report.publishedAt && (
          <span>
            Publicado:{" "}
            <span className="text-foreground">
              {new Date(report.publishedAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </span>
        )}
      </div>

      {/* Tesis */}
      {hasDoc(content.tesis.doc) && (
        <ViewSection title="Tesis de la semana">
          <TiptapContent doc={content.tesis.doc} />
        </ViewSection>
      )}

      {/* Resumen ejecutivo */}
      {content.executiveSummary.rows.length > 0 && (
        <ViewSection title="Resumen ejecutivo">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">KPI</th>
                  <th className="pb-2 pr-4 text-right font-medium">Target</th>
                  <th className="pb-2 pr-4 text-right font-medium">Actual</th>
                  <th className="pb-2 pr-4 text-left font-medium">Estado</th>
                  <th className="pb-2 text-left font-medium">Comentario</th>
                </tr>
              </thead>
              <tbody>
                {content.executiveSummary.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-4 font-medium">
                      {row.label}
                      {row.unit && (
                        <span className="ml-1 text-xs text-muted-foreground">({row.unit})</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{row.target ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{row.actual ?? "—"}</td>
                    <td className="py-1.5 pr-4">{STATUS_ICON[row.status] ?? row.status}</td>
                    <td className="py-1.5 text-muted-foreground">{row.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewSection>
      )}

      {/* Ambar/Rojo */}
      {content.amberRed.rows.length > 0 && (
        <ViewSection title="Detalle ambar / rojo">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 text-left font-medium">Estado</th>
                  <th className="pb-2 pr-4 text-left font-medium">KPI / Area</th>
                  <th className="pb-2 pr-4 text-left font-medium">Causa raiz</th>
                  <th className="pb-2 pr-4 text-left font-medium">Accion</th>
                  <th className="pb-2 pr-4 text-left font-medium">ETA</th>
                  <th className="pb-2 text-left font-medium">Escalado</th>
                </tr>
              </thead>
              <tbody>
                {content.amberRed.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {row.status === "rojo" ? "🔴" : "🟡"}
                    </td>
                    <td className="py-1.5 pr-4 font-medium">{row.kpi || "—"}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{row.rootCause || "—"}</td>
                    <td className="py-1.5 pr-4">{row.action || "—"}</td>
                    <td className="py-1.5 pr-4 whitespace-nowrap font-mono text-xs">{row.eta || "—"}</td>
                    <td className="py-1.5 text-muted-foreground">{row.escalation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewSection>
      )}

      {/* Highlights */}
      {hasDoc(content.highlights.doc) && (
        <ViewSection title="Highlights">
          <TiptapContent doc={content.highlights.doc} />
        </ViewSection>
      )}

      {/* Bloqueos */}
      {content.blockers.rows.length > 0 && (
        <ViewSection title="Bloqueos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">Bloqueo</th>
                  <th className="pb-2 pr-4 text-left font-medium">Owner</th>
                  <th className="pb-2 pr-4 text-left font-medium">Impacto</th>
                  <th className="pb-2 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {content.blockers.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-4">{row.description || "—"}</td>
                    <td className="py-1.5 pr-4 font-medium">{row.owner || "—"}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{row.impact || "—"}</td>
                    <td className="py-1.5"><StatusChip status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewSection>
      )}

      {/* Decisiones */}
      {content.decisions.rows.length > 0 && (
        <ViewSection title="Decisiones">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">Estado</th>
                  <th className="pb-2 pr-4 text-left font-medium">Decision</th>
                  <th className="pb-2 pr-4 text-left font-medium">Owner</th>
                  <th className="pb-2 pr-4 text-left font-medium">Fecha</th>
                  <th className="pb-2 text-left font-medium">Resolucion</th>
                </tr>
              </thead>
              <tbody>
                {content.decisions.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-4 whitespace-nowrap">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="py-1.5 pr-4">{row.description || "—"}</td>
                    <td className="py-1.5 pr-4 font-medium">{row.owner || "—"}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs">{row.deadline || "—"}</td>
                    <td className="py-1.5 text-muted-foreground">{row.resolution || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewSection>
      )}

      {/* Configuraciones */}
      {(content.configuraciones.totalConfigs != null ||
        content.configuraciones.techBreakdown.length > 0 ||
        content.configuraciones.problems) && (
        <ViewSection title="Configuraciones">
          <div className="space-y-4">
            {content.configuraciones.totalConfigs != null && (
              <div className="flex flex-wrap gap-6">
                <MetricPill label="Total configs" value={content.configuraciones.totalConfigs} />
                {content.configuraciones.successRate1st != null && (
                  <MetricPill label="Exito 1a" value={`${content.configuraciones.successRate1st}%`} />
                )}
                {content.configuraciones.successRate2nd != null && (
                  <MetricPill label="Exito 2a" value={`${content.configuraciones.successRate2nd}%`} />
                )}
              </div>
            )}
            {content.configuraciones.techBreakdown.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 text-left font-medium">Tecnico</th>
                      <th className="pb-2 pr-4 text-right font-medium">Configs</th>
                      <th className="pb-2 pr-4 text-right font-medium">Min. prom.</th>
                      <th className="pb-2 text-right font-medium">% exito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.configuraciones.techBreakdown.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 last:border-0">
                        <td className="py-1.5 pr-4 font-medium">{row.technician}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{row.count ?? "—"}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{row.avgMinutes ?? "—"}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {row.successRate != null ? `${row.successRate}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {content.configuraciones.problems && (
              <p className="text-sm text-muted-foreground">{content.configuraciones.problems}</p>
            )}
          </div>
        </ViewSection>
      )}

      {/* Envios */}
      {(content.envios.totalOps != null || content.envios.orders.length > 0) && (
        <ViewSection title="Envios / Logistica">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-6">
              {content.envios.totalOps != null && <MetricPill label="Total ops" value={content.envios.totalOps} />}
              {content.envios.completed != null && <MetricPill label="Completadas" value={content.envios.completed} />}
              {content.envios.shipped != null && <MetricPill label="Enviadas" value={content.envios.shipped} />}
              {content.envios.pending != null && <MetricPill label="Pendientes" value={content.envios.pending} />}
              {content.envios.grossRevenue != null && (
                <MetricPill
                  label="Facturacion bruta"
                  value={content.envios.grossRevenue.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                />
              )}
              {content.envios.sla7dPct != null && (
                <MetricPill label="SLA 7d" value={`${content.envios.sla7dPct}%`} />
              )}
            </div>
            {content.envios.orders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 text-left font-medium">Local</th>
                      <th className="pb-2 pr-4 text-left font-medium">Estado</th>
                      <th className="pb-2 text-left font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.envios.orders.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 last:border-0">
                        <td className="py-1.5 pr-4 font-medium">{row.venue}</td>
                        <td className="py-1.5 pr-4"><StatusChip status={row.status} /></td>
                        <td className="py-1.5 text-muted-foreground">{row.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ViewSection>
      )}

      {/* Soporte */}
      {(content.soporte.openIncidents != null ||
        content.soporte.rmas.length > 0 ||
        hasDoc(content.soporte.narrative)) && (
        <ViewSection title="Soporte HW">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-6">
              {content.soporte.openIncidents != null && (
                <MetricPill label="Incidencias abiertas" value={content.soporte.openIncidents} />
              )}
              {content.soporte.activeRmas != null && (
                <MetricPill label="RMAs activos" value={content.soporte.activeRmas} />
              )}
              {content.soporte.sla7dPct != null && (
                <MetricPill label="SLA 7d" value={`${content.soporte.sla7dPct}%`} />
              )}
              {content.soporte.avgResolutionHours != null && (
                <MetricPill label="Resolucion media" value={`${content.soporte.avgResolutionHours}h`} />
              )}
            </div>
            {content.soporte.rmas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 text-left font-medium">Proveedor</th>
                      <th className="pb-2 pr-4 text-left font-medium">Dispositivo</th>
                      <th className="pb-2 pr-4 text-left font-medium">Estado</th>
                      <th className="pb-2 pr-4 text-right font-medium">Dias</th>
                      <th className="pb-2 text-left font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.soporte.rmas.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 last:border-0">
                        <td className="py-1.5 pr-4 font-medium">{row.provider}</td>
                        <td className="py-1.5 pr-4">{row.device}</td>
                        <td className="py-1.5 pr-4">{row.status}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{row.daysOpen ?? "—"}</td>
                        <td className="py-1.5 text-muted-foreground">{row.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {hasDoc(content.soporte.narrative) && (
              <TiptapContent doc={content.soporte.narrative} />
            )}
          </div>
        </ViewSection>
      )}

      {/* Cajones */}
      {content.cajones.rows.length > 0 && (
        <ViewSection title="Cajones inteligentes">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">Cliente</th>
                  <th className="pb-2 pr-4 text-left font-medium">Estado</th>
                  <th className="pb-2 pr-4 text-left font-medium">Proveedor</th>
                  <th className="pb-2 pr-4 text-right font-medium">MRR</th>
                  <th className="pb-2 text-left font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {content.cajones.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-4 font-medium">{row.client}</td>
                    <td className="py-1.5 pr-4">{row.status || "—"}</td>
                    <td className="py-1.5 pr-4">{row.provider || "—"}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">
                      {row.mrr != null
                        ? row.mrr.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                        : "—"}
                    </td>
                    <td className="py-1.5 text-muted-foreground">{row.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
              {content.cajones.rows.some((r) => r.mrr != null) && (
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={3} className="py-2 text-xs font-medium text-muted-foreground">
                      MRR Total
                    </td>
                    <td className="py-2 text-right text-sm font-semibold tabular-nums">
                      {content.cajones.rows
                        .reduce((s, r) => s + (r.mrr ?? 0), 0)
                        .toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </ViewSection>
      )}

      {/* Performance */}
      {content.performance.members.some((m) => m.kpis.length > 0 || hasDoc(m.narrative)) && (
        <ViewSection title="Performance del equipo">
          <div className="space-y-4">
            {content.performance.members.map((member) => {
              if (!member.kpis.length && !hasDoc(member.narrative)) return null;
              return (
                <div key={member.member} className="rounded-lg border border-border p-4">
                  <p className="mb-3 text-sm font-semibold">{member.displayName}</p>
                  {member.kpis.length > 0 && (
                    <div className="mb-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="pb-1.5 pr-4 text-left font-medium">KPI</th>
                            <th className="pb-1.5 pr-4 text-right font-medium">Valor</th>
                            <th className="pb-1.5 pr-4 text-right font-medium">Target</th>
                            <th className="pb-1.5 text-left font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {member.kpis.map((kpi) => (
                            <tr key={kpi.id} className="border-b border-border/40 last:border-0">
                              <td className="py-1 pr-4">{kpi.label}</td>
                              <td className="py-1 pr-4 text-right tabular-nums">{kpi.value || "—"}</td>
                              <td className="py-1 pr-4 text-right tabular-nums text-muted-foreground">
                                {kpi.target || "—"}
                              </td>
                              <td className="py-1">{STATUS_ICON[kpi.status] ?? kpi.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {hasDoc(member.narrative) && (
                    <TiptapContent
                      doc={member.narrative}
                      className="prose prose-sm max-w-none dark:prose-invert"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ViewSection>
      )}

      {/* Foco proxima semana */}
      {content.nextFocus.rows.length > 0 && (
        <ViewSection title="Foco proxima semana">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">Prioridad</th>
                  <th className="pb-2 pr-4 text-left font-medium">Owner</th>
                  <th className="pb-2 pr-4 text-left font-medium">Objetivo</th>
                  <th className="pb-2 text-left font-medium">Output esperado</th>
                </tr>
              </thead>
              <tbody>
                {content.nextFocus.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-4">
                      {row.priority === "alta" ? "🔴 Alta" : row.priority === "media" ? "🟡 Media" : "🟢 Baja"}
                    </td>
                    <td className="py-1.5 pr-4 font-medium">{row.owner || "—"}</td>
                    <td className="py-1.5 pr-4">{row.objective || "—"}</td>
                    <td className="py-1.5 text-muted-foreground">{row.output || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewSection>
      )}

      {/* Comentarios Pablo */}
      {hasDoc(content.pabloComments.doc) && (
        <ViewSection title="Comentarios Pablo">
          <TiptapContent doc={content.pabloComments.doc} />
        </ViewSection>
      )}

      {/* KPI Snapshot */}
      {snapshot && (
        <ViewSection title="KPI Snapshot (al publicar)">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              Capturado:{" "}
              {new Date(snapshot.frozenAt).toLocaleString("es-ES", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs", snapshot.sourceHealth.mainops.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
              MainOPS {snapshot.sourceHealth.mainops.ok ? "OK" : "Error"}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs", snapshot.sourceHealth.hwtool.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
              HW Tool {snapshot.sourceHealth.hwtool.ok ? "OK" : "Error"}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs", snapshot.sourceHealth.hsm.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
              HSM {snapshot.sourceHealth.hsm.ok ? "OK" : "Error"}
            </span>
          </div>
        </ViewSection>
      )}
    </div>
  );
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
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
        "rounded-full px-2 py-0.5 text-xs font-medium",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
