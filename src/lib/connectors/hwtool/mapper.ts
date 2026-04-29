import type { HwToolApiResponse } from "./schema";
import { labelForProblem } from "./labels";
import type { HwToolMetrics } from "./types";

/**
 * Convierte el response crudo de la API (snake_case) al shape interno
 * del portal (camelCase) y deriva campos calculados:
 * - successRateFirstTry: % de configs OK a 1ª (config_ok + config_pnp) / configuracion
 * - secondConfigRate: % de configs que requieren 2ª visita / configuracion
 *
 * Si `principal.breakdown.configuracion` es 0, los porcentajes derivados
 * son 0 (no division by zero).
 */
export function mapHwToolResponse(raw: HwToolApiResponse): HwToolMetrics {
  const generatedAt = new Date(raw.generated_at);
  const from = raw.filters.from ? new Date(raw.filters.from) : null;
  const to = raw.filters.to ? new Date(raw.filters.to) : null;

  const configTotal = raw.principal.breakdown.configuracion;
  const configOkPlusPnp =
    raw.detailed.config_ok.count + raw.detailed.config_pnp.count;
  const successRateFirstTry =
    configTotal > 0
      ? Math.round((configOkPlusPnp / configTotal) * 1000) / 10 // 1 decimal
      : 0;
  const secondConfigRate =
    configTotal > 0
      ? Math.round((raw.detailed.config_requires_2nd.count / configTotal) * 1000) / 10
      : 0;

  return {
    generatedAt,
    filters: {
      from,
      to,
      technician: raw.filters.technician,
    },
    principal: {
      totalSessions: raw.principal.total_sessions,
      configuracion: raw.principal.breakdown.configuracion,
      auditoria: raw.principal.breakdown.auditoria,
      noshow: raw.principal.breakdown.noshow,
    },
    detailed: {
      configOk: {
        count: raw.detailed.config_ok.count,
        percentOfTotal: raw.detailed.config_ok.percent_of_total,
      },
      configPnp: {
        count: raw.detailed.config_pnp.count,
        percentOfTotal: raw.detailed.config_pnp.percent_of_total,
      },
      configRequires2nd: {
        count: raw.detailed.config_requires_2nd.count,
        percentOfTotal: raw.detailed.config_requires_2nd.percent_of_total,
      },
      auditoria: {
        count: raw.detailed.auditoria.count,
        percentOfTotal: raw.detailed.auditoria.percent_of_total,
      },
      noshow: {
        count: raw.detailed.noshow.count,
        percentOfTotal: raw.detailed.noshow.percent_of_total,
      },
    },
    problems: raw.additional.problems_in_configs.map((p) => ({
      key: p.problem,
      label: labelForProblem(p.problem),
      count: p.count,
    })),
    equipment: {
      own: raw.additional.equipment.own,
      external: raw.additional.equipment.external,
      totalItems: raw.additional.equipment.total_items,
    },
    successRateFirstTry,
    secondConfigRate,
  };
}
