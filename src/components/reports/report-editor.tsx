"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutosaveIndicator, type AutosaveState } from "./autosave-indicator";
import { TiptapEditor } from "./tiptap-editor";
import { ExecutiveSummaryEditor } from "./sections/executive-summary-editor";
import { AmberRedEditor } from "./sections/amber-red-editor";
import { BlockersEditor } from "./sections/blockers-editor";
import { DecisionsEditor } from "./sections/decisions-editor";
import { ConfiguracionesEditor } from "./sections/configuraciones-editor";
import { EnviosEditor } from "./sections/envios-editor";
import { SoporteEditor } from "./sections/soporte-editor";
import { CajonesEditor } from "./sections/cajones-editor";
import { PerformanceEditor } from "./sections/performance-editor";
import { NextFocusEditor } from "./sections/next-focus-editor";
import { saveSection, publishReport, setGlobalStatus, setReportTitle } from "@/server/actions/reports";
import type { ReportContent } from "@/lib/reports/schema";

interface ReportEditorProps {
  report: {
    id: string;
    type: string;
    periodKey: string;
    periodLabel: string;
    title: string;
    globalStatus: string | null;
    periodFrom: string | null;
    periodTo: string | null;
  };
  initialContent: ReportContent;
  currentUserId: string;
}

type SectionKey = keyof ReportContent;

const DEFAULT_OPEN = new Set([
  "tesis",
  "executiveSummary",
  "highlights",
  "nextFocus",
]);

export function ReportEditor({ report, initialContent }: ReportEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<ReportContent>(initialContent);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [title, setTitle] = useState(report.title);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [globalStatus, setGlobalStatusState] = useState<string | null>(
    report.globalStatus,
  );
  const [isPublishing, startPublishing] = useTransition();
  const [openSections, setOpenSections] = useState<Set<string>>(DEFAULT_OPEN);

  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const scheduleAutosave = useCallback(
    (sectionKey: string, payload: unknown) => {
      const existing = debounceRef.current.get(sectionKey);
      if (existing) clearTimeout(existing);
      setAutosaveState("saving");

      const timer = setTimeout(async () => {
        const retries = retryCountRef.current.get(sectionKey) ?? 0;
        const result = await saveSection({ reportId: report.id, sectionKey, payload });

        if (result.ok) {
          retryCountRef.current.set(sectionKey, 0);
          setAutosaveState("saved");
          setLastSavedAt(new Date());
          setTimeout(() => setAutosaveState("idle"), 4000);
        } else {
          if (retries < 2) {
            retryCountRef.current.set(sectionKey, retries + 1);
            setTimeout(() => scheduleAutosave(sectionKey, payload), 2000 * (retries + 1));
          } else {
            retryCountRef.current.set(sectionKey, 0);
            setAutosaveState("error");
            toast.error(`Error al guardar "${sectionKey}". ${result.error}`);
          }
        }
      }, 1500);

      debounceRef.current.set(sectionKey, timer);
    },
    [report.id],
  );

  function updateSection<K extends SectionKey>(key: K, value: ReportContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
    scheduleAutosave(key as string, value);
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    setAutosaveState("saving");
    titleTimerRef.current = setTimeout(async () => {
      const res = await setReportTitle({ reportId: report.id, title: v.trim() || "Sin título" });
      if (res.ok) {
        setAutosaveState("saved");
        setLastSavedAt(new Date());
      } else {
        setAutosaveState("error");
        toast.error(res.error);
      }
    }, 1200);
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handlePublish() {
    startPublishing(async () => {
      const result = await publishReport({ reportId: report.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Informe publicado.");
      router.push(`/reports/${report.id}`);
    });
  }

  async function handleGlobalStatus(status: "verde" | "amarillo" | "rojo") {
    const result = await setGlobalStatus({ reportId: report.id, globalStatus: status });
    if (result.ok) setGlobalStatusState(status);
    else toast.error(result.error);
  }

  const isOpen = (key: string) => openSections.has(key);

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <AutosaveIndicator state={autosaveState} lastSavedAt={lastSavedAt} />
          <div className="flex items-center gap-1">
            {(["verde", "amarillo", "rojo"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleGlobalStatus(s)}
                title={`Estado global: ${s}`}
                className={`h-4 w-4 rounded-full transition-opacity ${
                  globalStatus === s
                    ? "opacity-100 ring-2 ring-offset-1 ring-foreground/30"
                    : "opacity-40 hover:opacity-70"
                } ${
                  s === "verde"
                    ? "bg-status-ok"
                    : s === "amarillo"
                      ? "bg-status-warn"
                      : "bg-status-danger"
                }`}
              />
            ))}
          </div>
        </div>
        <Button onClick={handlePublish} disabled={isPublishing}>
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publicando…
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Publicar
            </>
          )}
        </Button>
      </div>

      {/* Cabecera del informe — título + autor (estilo Notion) */}
      <div className="space-y-3 rounded-lg border border-border bg-card px-4 py-3">
        <input
          type="text"
          value={title}
          placeholder="Título del informe (p. ej. W20 — JJ — Hardware)"
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full rounded-sm border-0 bg-transparent text-2xl font-bold tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center gap-3 border-t border-border pt-2">
          <label htmlFor="report-author" className="text-sm font-medium text-muted-foreground">
            Autor
          </label>
          <input
            id="report-author"
            type="text"
            value={content.author}
            placeholder="Nombre del autor"
            onChange={(e) => updateSection("author", e.target.value)}
            className="flex-1 rounded-sm border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* 🎯 Tesis */}
      <EditorSection title="🎯 Tesis de la semana" sectionKey="tesis" open={isOpen("tesis")} onToggle={() => toggleSection("tesis")}>
        <TiptapEditor
          value={content.tesis.doc}
          onChange={(doc) => updateSection("tesis", { doc })}
          placeholder="Escribe la tesis de la semana…"
        />
      </EditorSection>

      {/* 🚦 Resumen ejecutivo */}
      <EditorSection title="🚦 Resumen ejecutivo" sectionKey="executiveSummary" open={isOpen("executiveSummary")} onToggle={() => toggleSection("executiveSummary")}>
        <ExecutiveSummaryEditor
          value={content.executiveSummary}
          onChange={(v) => updateSection("executiveSummary", v)}
        />
      </EditorSection>

      {/* 🔴🟡 Detalle ámbar/rojo */}
      <EditorSection title="🔴🟡 Detalle ámbar / rojo" sectionKey="amberRed" open={isOpen("amberRed")} onToggle={() => toggleSection("amberRed")}>
        <AmberRedEditor
          value={content.amberRed}
          onChange={(v) => updateSection("amberRed", v)}
        />
      </EditorSection>

      {/* ✅ Highlights */}
      <EditorSection title="✅ Highlights" sectionKey="highlights" open={isOpen("highlights")} onToggle={() => toggleSection("highlights")}>
        <TiptapEditor
          value={content.highlights.doc}
          onChange={(doc) => updateSection("highlights", { doc })}
          placeholder="Logros y hitos de la semana…"
        />
      </EditorSection>

      {/* 🚧 Bloqueos */}
      <EditorSection title="🚧 Bloqueos" sectionKey="blockers" open={isOpen("blockers")} onToggle={() => toggleSection("blockers")}>
        <BlockersEditor
          value={content.blockers}
          onChange={(v) => updateSection("blockers", v)}
        />
      </EditorSection>

      {/* 🔴 Decisiones */}
      <EditorSection title="🔴 Decisiones" sectionKey="decisions" open={isOpen("decisions")} onToggle={() => toggleSection("decisions")}>
        <DecisionsEditor
          value={content.decisions}
          onChange={(v) => updateSection("decisions", v)}
        />
      </EditorSection>

      {/* 🛠 Configuraciones */}
      <EditorSection title="🛠 Configuraciones (Guille)" sectionKey="configuraciones" open={isOpen("configuraciones")} onToggle={() => toggleSection("configuraciones")}>
        <ConfiguracionesEditor
          value={content.configuraciones}
          onChange={(v) => updateSection("configuraciones", v)}
        />
      </EditorSection>

      {/* 🛠 Envíos */}
      <EditorSection title="🛠 Envíos / Logística (Domi)" sectionKey="envios" open={isOpen("envios")} onToggle={() => toggleSection("envios")}>
        <EnviosEditor
          value={content.envios}
          onChange={(v) => updateSection("envios", v)}
        />
      </EditorSection>

      {/* 🛠 Soporte */}
      <EditorSection title="🛠 Soporte HW (Domi + JJ)" sectionKey="soporte" open={isOpen("soporte")} onToggle={() => toggleSection("soporte")}>
        <SoporteEditor
          value={content.soporte}
          onChange={(v) => updateSection("soporte", v)}
        />
      </EditorSection>

      {/* 🛠 Cajones */}
      <EditorSection title="🛠 Cajones inteligentes (JJ)" sectionKey="cajones" open={isOpen("cajones")} onToggle={() => toggleSection("cajones")}>
        <CajonesEditor
          value={content.cajones}
          onChange={(v) => updateSection("cajones", v)}
        />
      </EditorSection>

      {/* 👥 Performance */}
      <EditorSection title="👥 Performance del equipo" sectionKey="performance" open={isOpen("performance")} onToggle={() => toggleSection("performance")}>
        <PerformanceEditor
          value={content.performance}
          onChange={(v) => updateSection("performance", v)}
        />
      </EditorSection>

      {/* 📌 Foco próxima semana */}
      <EditorSection title="📌 Foco próxima semana" sectionKey="nextFocus" open={isOpen("nextFocus")} onToggle={() => toggleSection("nextFocus")}>
        <NextFocusEditor
          value={content.nextFocus}
          onChange={(v) => updateSection("nextFocus", v)}
        />
      </EditorSection>

      {/* 💬 Comentarios Pablo */}
      <EditorSection title="💬 Comentarios Pablo" sectionKey="pabloComments" open={isOpen("pabloComments")} onToggle={() => toggleSection("pabloComments")}>
        <TiptapEditor
          value={content.pabloComments.doc}
          onChange={(doc) => updateSection("pabloComments", { doc })}
          placeholder="Placeholder para respuesta de Pablo…"
        />
      </EditorSection>
    </div>
  );
}

function EditorSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  sectionKey: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer select-none py-3" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
