import { describe, it, expect } from "vitest";

import { mapHwToolResponse } from "./mapper";
import { hwToolApiResponseSchema } from "./schema";

/**
 * Payload real obtenido vía curl al endpoint el 2026-04-29 con rango abril.
 * Sirve como golden master del contrato actual (schema_version 1.0.0).
 */
const APRIL_2026_PAYLOAD = {
  generated_at: "2026-04-29T12:23:09.997Z",
  schema_version: "1.0.0",
  filters: { from: "2026-04-01", to: "2026-04-30", technician: null },
  principal: {
    total_sessions: 136,
    breakdown: { configuracion: 118, auditoria: 3, noshow: 15 },
  },
  detailed: {
    config_ok: { count: 79, percent_of_total: 58.09 },
    config_pnp: { count: 17, percent_of_total: 12.5 },
    config_requires_2nd: { count: 22, percent_of_total: 16.18 },
    auditoria: { count: 3, percent_of_total: 2.21 },
    noshow: { count: 15, percent_of_total: 11.03 },
  },
  additional: {
    problems_in_configs: [
      { problem: "no_problem", count: 85 },
      { problem: "preparacion_cliente", count: 12 },
      { problem: "hardware_problem", count: 11 },
      { problem: "network_problem", count: 7 },
      { problem: "other_problem", count: 2 },
      { problem: "nivel_tech_cliente", count: 1 },
    ],
    equipment: {
      own: { count: 119, percent: 38.64 },
      external: { count: 189, percent: 61.36 },
      total_items: 308,
    },
  },
};

describe("hwtool mapper", () => {
  it("parsea el payload real de abril 2026", () => {
    const parsed = hwToolApiResponseSchema.parse(APRIL_2026_PAYLOAD);
    expect(parsed.principal.total_sessions).toBe(136);
  });

  it("mapea snake_case → camelCase manteniendo valores", () => {
    const m = mapHwToolResponse(APRIL_2026_PAYLOAD);
    expect(m.principal.totalSessions).toBe(136);
    expect(m.principal.configuracion).toBe(118);
    expect(m.detailed.configOk.count).toBe(79);
    expect(m.detailed.configOk.percentOfTotal).toBe(58.09);
    expect(m.detailed.configRequires2nd.count).toBe(22);
    expect(m.equipment.totalItems).toBe(308);
  });

  it("calcula successRateFirstTry = (config_ok + config_pnp) / configuracion", () => {
    const m = mapHwToolResponse(APRIL_2026_PAYLOAD);
    // (79 + 17) / 118 = 0.81355... → 81.4%
    expect(m.successRateFirstTry).toBe(81.4);
  });

  it("calcula secondConfigRate = config_requires_2nd / configuracion", () => {
    const m = mapHwToolResponse(APRIL_2026_PAYLOAD);
    // 22 / 118 = 0.18644... → 18.6%
    expect(m.secondConfigRate).toBe(18.6);
  });

  it("etiqueta los problemas en español", () => {
    const m = mapHwToolResponse(APRIL_2026_PAYLOAD);
    const p = m.problems.find((x) => x.key === "no_problem");
    expect(p?.label).toBe("Sin problemas");
    expect(p?.count).toBe(85);
  });

  it("evita división por cero cuando configuracion=0", () => {
    const empty = {
      ...APRIL_2026_PAYLOAD,
      principal: { ...APRIL_2026_PAYLOAD.principal, breakdown: { configuracion: 0, auditoria: 0, noshow: 0 } },
      detailed: {
        config_ok: { count: 0, percent_of_total: 0 },
        config_pnp: { count: 0, percent_of_total: 0 },
        config_requires_2nd: { count: 0, percent_of_total: 0 },
        auditoria: { count: 0, percent_of_total: 0 },
        noshow: { count: 0, percent_of_total: 0 },
      },
    };
    const m = mapHwToolResponse(empty);
    expect(m.successRateFirstTry).toBe(0);
    expect(m.secondConfigRate).toBe(0);
  });

  it("acepta claves de problemas no mapeadas y les da fallback legible", () => {
    const withUnknown = {
      ...APRIL_2026_PAYLOAD,
      additional: {
        ...APRIL_2026_PAYLOAD.additional,
        problems_in_configs: [
          ...APRIL_2026_PAYLOAD.additional.problems_in_configs,
          { problem: "future_unknown_key", count: 4 },
        ],
      },
    };
    const m = mapHwToolResponse(withUnknown);
    const unknown = m.problems.find((x) => x.key === "future_unknown_key");
    expect(unknown?.label).toBe("future unknown key");
    expect(unknown?.count).toBe(4);
  });
});
