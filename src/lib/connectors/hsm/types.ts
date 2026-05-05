/**
 * Tipos del connector HSM (Hardware Support Manager) — shape interno del portal.
 * Convención: camelCase. El mapper traduce el response API (snake_case) a estos tipos.
 *
 * Hero del escudo en la home: `slaCompliancePctDelta` (mejora MoM en pp).
 * Decisión 2026-04-30: en HSM tenemos pain reciente, mejor mostrar la TENDENCIA
 * que el absoluto (que puede ser ~60% y demoledor). Si el delta mejora (verde),
 * el equipo está en pendiente positiva aunque el absoluto siga bajo.
 */

export type HsmIncidentPriority = "critica" | "alta" | "media" | "baja";

export type HsmAgingBucket = "lt_1d" | "1_3d" | "3_7d" | "gt_7d";

export interface HsmIncidentsByPriority {
  priority: HsmIncidentPriority | string;
  count: number;
}

export interface HsmAgingPoint {
  bucket: HsmAgingBucket;
  count: number;
}

export interface HsmTopProvider {
  providerId: string;
  providerName: string;
  rmaCount: number;
  /** 0..100 */
  successRatePct: number;
  avgTurnaroundDays: number | null;
}

/** Métricas del periodo actual (las que se enseñan en el banner y la pestaña). */
export interface HsmCurrentMetrics {
  openIncidents: number;
  activeRmas: number;
  /** % SLA cumplido global (0..100). El "duro" tradicional. */
  slaCompliancePct: number;
  /** Incidencias hoy con elapsed > umbral (todas las prioridades). */
  overdueCount: number;
  /** null si no hay resueltos en el periodo. */
  avgResolutionHours: number | null;
  /** % incidencias resueltas que se reabrieron (0..100). */
  reopenRatePct: number;
  /** Días promedio createdAt → status final RMA. null si no hay cerradas. */
  avgRmaTurnaroundDays: number | null;
  /** % CRÍTICAS resueltas en plazo. null si no hubo críticas. */
  criticalInSlaPct: number | null;
  /** (cerradas en periodo) / (creadas en periodo). 1 = paridad, >1 desatasco. */
  throughputRatio: number;
  incidentsByPriority: HsmIncidentsByPriority[];
  agingDistribution: HsmAgingPoint[];
  /** Top 5 proveedores por rma_count. */
  topProviders: HsmTopProvider[];
}

/** Periodo anterior equivalente (mismo número de días, justo antes de `from`). */
export interface HsmPreviousMetrics {
  slaCompliancePct: number;
  avgResolutionHours: number | null;
  reopenRatePct: number;
  /** Snapshot de openIncidents al cierre del periodo anterior. */
  openIncidentsAtClose: number;
}

export interface HsmMetrics {
  generatedAt: Date;
  range: { from: Date; to: Date; prevFrom: Date; prevTo: Date };
  current: HsmCurrentMetrics;
  previous: HsmPreviousMetrics;
  /** Delta computed: current.slaCompliancePct − previous.slaCompliancePct (en pp). */
  slaDeltaPp: number;
}

export interface HsmPeriodFilter {
  from?: Date;
  to?: Date;
}
