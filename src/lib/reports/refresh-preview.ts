import type { ExecutiveSummary } from "./schema";

/** Valores comparables de una fila del scorecard (para el diff del refresh). */
export interface ExecRowValues {
  actual: string;
  /** Columna "Semana anterior" (campo `delta` en el schema). */
  prev: string;
  status: string;
}

/** Diferencia de una fila entre el borrador actual y lo que traerían las fuentes. */
export interface ExecRowDiff {
  kpiKey: string;
  label: string;
  source: "auto" | "manual";
  before: ExecRowValues;
  after: ExecRowValues;
  /** true si actual / semana anterior / semáforo cambian. */
  changed: boolean;
}

/**
 * Resultado de `previewReportRefresh`: el diff por KPI + la sección ejecutiva
 * ya fusionada que se aplicaría al confirmar (lo que ves es lo que se guarda).
 */
export interface RefreshPreview {
  diff: ExecRowDiff[];
  proposed: ExecutiveSummary;
  changedCount: number;
}
