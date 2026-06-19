"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutosaveIndicator, type AutosaveState } from "./autosave-indicator";
import { TiptapEditor } from "./tiptap-editor";
import { saveSection, publishReport, setGlobalStatus } from "@/server/actions/reports";
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

export function ReportEditor({ report, initialContent }: ReportEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<ReportContent>(initialContent);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [globalStatus, setGlobalStatusState] = useState<string | null>(
    report.globalStatus,
  );
  const [isPublishing, startPublishing] = useTransition();
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["tesis", "executiveSummary", "highlights"]),
  );

  // Debounce timer per section
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const scheduleAutosave = useCallback(
    (sectionKey: string, payload: unknown) => {
      // Limpiar timer previo de la misma sección
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
            // Reintento exponencial
            setTimeout(() => scheduleAutosave(sectionKey, payload), 2000 * (retries + 1));
          } else {
            retryCountRef.current.set(sectionKey, 0);
            setAutosaveState("error");
            toast.error(`Error al guardar la sección. ${result.error}`);
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
      toast.success("Informe publicado correctamente.");
      router.push(`/reports/${report.id}`);
    });
  }

  async function handleGlobalStatus(status: "verde" | "amarillo" | "rojo") {
    const result = await setGlobalStatus({ reportId: report.id, globalStatus: status });
    if (result.ok) {
      setGlobalStatusState(status);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <AutosaveIndicator state={autosaveState} lastSavedAt={lastSavedAt} />
          {/* Semáforo global */}
          <div className="flex items-center gap-1">
            {(["verde", "amarillo", "rojo"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleGlobalStatus(s)}
                title={`Estado: ${s}`}
                className={`h-4 w-4 rounded-full transition-opacity ${
                  globalStatus === s ? "opacity-100 ring-2 ring-offset-1 ring-foreground/30" : "opacity-40 hover:opacity-70"
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

      {/* Sección: Tesis */}
      <EditorSection
        title="🎯 Tesis de la semana"
        open={openSections.has("tesis")}
        onToggle={() => toggleSection("tesis")}
      >
        <TiptapEditor
          value={content.tesis.doc}
          onChange={(doc) => updateSection("tesis", { doc })}
          placeholder="Escribe la tesis de la semana…"
        />
      </EditorSection>

      {/* Sección: Highlights */}
      <EditorSection
        title="✅ Highlights"
        open={openSections.has("highlights")}
        onToggle={() => toggleSection("highlights")}
      >
        <TiptapEditor
          value={content.highlights.doc}
          onChange={(doc) => updateSection("highlights", { doc })}
          placeholder="Logros y hitos destacados de la semana…"
        />
      </EditorSection>

      {/* Sección: Comentarios Pablo (placeholder) */}
      <EditorSection
        title="💬 Comentarios Pablo"
        open={openSections.has("pabloComments")}
        onToggle={() => toggleSection("pabloComments")}
      >
        <TiptapEditor
          value={content.pabloComments.doc}
          onChange={(doc) => updateSection("pabloComments", { doc })}
          placeholder="Placeholder para respuesta de Pablo…"
        />
      </EditorSection>

      {/* Secciones próximas (Fase 2) — collapsed con nota */}
      {["executiveSummary", "amberRed", "blockers", "decisions", "configuraciones", "envios", "soporte", "cajones", "performance", "nextFocus"].map((key) => (
        <div
          key={key}
          className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium capitalize">{sectionLabel(key)}</span>
            {" — "}
            <span className="italic">Disponible en Fase 2</span>
          </p>
        </div>
      ))}
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
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

const SECTION_LABELS: Record<string, string> = {
  executiveSummary: "🚦 Resumen ejecutivo",
  amberRed: "🔴🟡 Detalle ámbar/rojo",
  blockers: "🚧 Bloqueos",
  decisions: "🔴 Decisiones",
  configuraciones: "🛠 Configuraciones",
  envios: "🛠 Envíos / Logística",
  soporte: "🛠 Soporte HW",
  cajones: "🛠 Cajones inteligentes",
  performance: "👥 Performance equipo",
  nextFocus: "📌 Foco próxima semana",
};

function sectionLabel(key: string): string {
  return SECTION_LABELS[key] ?? key;
}
