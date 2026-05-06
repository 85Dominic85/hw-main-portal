import type { HsmApiResponse } from "./schema";
import type {
  HsmAgingBucket,
  HsmAgingPoint,
  HsmCurrentMetrics,
  HsmIncidentsByPriority,
  HsmMetrics,
  HsmPreviousMetrics,
  HsmQuickConsultationByTechnician,
  HsmQuickConsultationsCurrent,
  HsmQuickConsultationsPrevious,
  HsmTopProvider,
} from "./types";

/**
 * Mapea el response API (snake_case + ISO strings) al shape interno
 * (camelCase + Date). El portal NUNCA usa el response raw directamente
 * fuera del cliente HTTP.
 *
 * Calcula también el `slaDeltaPp` que es lo que va al hero del escudo en
 * la home: la mejora MoM en puntos porcentuales.
 */
export function mapHsmResponse(raw: HsmApiResponse): HsmMetrics {
  const current = mapCurrent(raw.current);
  const previous = mapPrevious(raw.previous);
  const slaDeltaPp =
    Math.round((current.slaCompliancePct - previous.slaCompliancePct) * 10) / 10;

  return {
    generatedAt: new Date(raw.generated_at),
    range: {
      from: new Date(raw.filters.from),
      to: new Date(raw.filters.to),
      prevFrom: new Date(raw.filters.prev_from),
      prevTo: new Date(raw.filters.prev_to),
    },
    current,
    previous,
    slaDeltaPp,
  };
}

function mapCurrent(raw: HsmApiResponse["current"]): HsmCurrentMetrics {
  return {
    openIncidents: raw.open_incidents,
    activeRmas: raw.active_rmas,
    slaCompliancePct: raw.sla_compliance_pct,
    overdueCount: raw.overdue_count,
    avgResolutionHours: raw.avg_resolution_hours,
    reopenRatePct: raw.reopen_rate_pct,
    avgRmaTurnaroundDays: raw.avg_rma_turnaround_days,
    criticalInSlaPct: raw.critical_in_sla_pct,
    throughputRatio: raw.throughput_ratio,
    incidentsByPriority: raw.incidents_by_priority.map(mapIncidentByPriority),
    agingDistribution: raw.aging_distribution.map(mapAging),
    topProviders: raw.top_providers.map(mapProvider),
    quickConsultations: raw.quick_consultations
      ? mapQuickConsultationsCurrent(raw.quick_consultations)
      : null,
  };
}

function mapPrevious(raw: HsmApiResponse["previous"]): HsmPreviousMetrics {
  return {
    slaCompliancePct: raw.sla_compliance_pct,
    avgResolutionHours: raw.avg_resolution_hours,
    reopenRatePct: raw.reopen_rate_pct,
    openIncidentsAtClose: raw.open_incidents_at_close,
    quickConsultations: raw.quick_consultations
      ? mapQuickConsultationsPrevious(raw.quick_consultations)
      : null,
  };
}

function mapQuickConsultationsCurrent(
  raw: NonNullable<HsmApiResponse["current"]["quick_consultations"]>,
): HsmQuickConsultationsCurrent {
  return {
    count: raw.count,
    totalMinutes: raw.total_minutes,
    avgMinutes: raw.avg_minutes,
    byTechnician: raw.by_technician.map(mapQuickByTechnician),
    conversionRatePct: raw.conversion_rate_pct,
  };
}

function mapQuickConsultationsPrevious(
  raw: NonNullable<HsmApiResponse["previous"]["quick_consultations"]>,
): HsmQuickConsultationsPrevious {
  return {
    count: raw.count,
    totalMinutes: raw.total_minutes,
  };
}

function mapQuickByTechnician(
  raw: NonNullable<HsmApiResponse["current"]["quick_consultations"]>["by_technician"][number],
): HsmQuickConsultationByTechnician {
  return {
    name: raw.name,
    count: raw.count,
    totalMinutes: raw.total_minutes,
  };
}

function mapIncidentByPriority(
  raw: HsmApiResponse["current"]["incidents_by_priority"][number],
): HsmIncidentsByPriority {
  return { priority: raw.priority, count: raw.count };
}

function mapAging(
  raw: HsmApiResponse["current"]["aging_distribution"][number],
): HsmAgingPoint {
  return { bucket: raw.bucket as HsmAgingBucket, count: raw.count };
}

function mapProvider(
  raw: HsmApiResponse["current"]["top_providers"][number],
): HsmTopProvider {
  return {
    providerId: raw.provider_id,
    providerName: raw.provider_name,
    rmaCount: raw.rma_count,
    successRatePct: raw.success_rate_pct,
    avgTurnaroundDays: raw.avg_turnaround_days,
  };
}
