import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapEditor } from "./tiptap-editor";
import type { ReportContent, KpiSnapshot } from "@/lib/reports/schema";

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
  const hasContent = (doc: { content?: unknown[] }) =>
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
            <time dateTime={report.publishedAt}>
              {new Date(report.publishedAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </span>
        )}
        {snapshot && (
          <span className="text-xs">
            Snapshot KPI:{" "}
            <span
              className={
                snapshot.sourceHealth.mainops.ok &&
                snapshot.sourceHealth.hwtool.ok &&
                snapshot.sourceHealth.hsm.ok
                  ? "text-status-ok"
                  : "text-status-warn"
              }
            >
              {[
                snapshot.sourceHealth.mainops.ok ? "MOP ✓" : "MOP ✗",
                snapshot.sourceHealth.hwtool.ok ? "HWT ✓" : "HWT ✗",
                snapshot.sourceHealth.hsm.ok ? "HSM ✓" : "HSM ✗",
              ].join(" · ")}
            </span>
          </span>
        )}
      </div>

      {/* Tesis */}
      {hasContent(content.tesis.doc) && (
        <ViewerSection title="🎯 Tesis de la semana">
          <TiptapEditor value={content.tesis.doc} onChange={() => {}} readOnly />
        </ViewerSection>
      )}

      {/* Resumen ejecutivo — snapshot KPI */}
      {snapshot && snapshot.entries.length > 0 && (
        <ViewerSection title="🚦 Resumen ejecutivo (KPIs)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/30">
                  <th className="px-3 py-2 text-left font-medium">KPI</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 text-right font-medium">Unidad</th>
                  <th className="px-3 py-2 text-left font-medium">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.entries.map((e) => (
                  <tr key={e.key} className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {e.key}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {e.value !== null && e.value !== undefined
                        ? e.value.toLocaleString("es-ES", { maximumFractionDigits: 1 })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {e.unit ?? ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {e.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ViewerSection>
      )}

      {/* Highlights */}
      {hasContent(content.highlights.doc) && (
        <ViewerSection title="✅ Highlights">
          <TiptapEditor value={content.highlights.doc} onChange={() => {}} readOnly />
        </ViewerSection>
      )}

      {/* Comentarios Pablo */}
      {hasContent(content.pabloComments.doc) && (
        <ViewerSection title="💬 Comentarios Pablo">
          <TiptapEditor
            value={content.pabloComments.doc}
            onChange={() => {}}
            readOnly
          />
        </ViewerSection>
      )}

      {/* Placeholder resto de secciones — Fase 2 */}
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Tablas de Resumen ejecutivo, Bloqueos, Decisiones, Envíos, Soporte y
          Performance estarán disponibles en Fase 2.
        </p>
      </div>
    </div>
  );
}

function ViewerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
