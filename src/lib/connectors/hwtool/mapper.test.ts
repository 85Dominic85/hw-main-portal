import { describe, it, expect } from "vitest";

import { mapHwToolResponse } from "./mapper";
import { hwToolApiResponseSchema } from "./schema";

/**
 * Payload v1.0.0 (sin crm_test) — golden master del contrato anterior.
 * Sigue siendo válido porque crm_test es opcional en el schema.
 */
const PAYLOAD_V1_0_0 = {
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

/**
 * Payload v1.1.0 con additional.crm_test ampliado.
 * Sample real obtenido el 2026-04-29 con un CRM test registrado.
 */
const PAYLOAD_V1_1_0 = {
  generated_at: "2026-04-29T14:57:56.368Z",
  schema_version: "1.1.0",
  filters: { from: "2026-04-01", to: "2026-04-30", technician: null, crm_test: null },
  principal: {
    total_sessions: 139,
    breakdown: { configuracion: 121, auditoria: 3, noshow: 15 },
  },
  detailed: {
    config_ok: { count: 80, percent_of_total: 57.55 },
    config_pnp: { count: 17, percent_of_total: 12.23 },
    config_requires_2nd: { count: 24, percent_of_total: 17.27 },
    auditoria: { count: 3, percent_of_total: 2.16 },
    noshow: { count: 15, percent_of_total: 10.79 },
  },
  additional: {
    problems_in_configs: [
      { problem: "no_problem", count: 87 },
      { problem: "hardware_problem", count: 12 },
      { problem: "preparacion_cliente", count: 12 },
      { problem: "network_problem", count: 7 },
      { problem: "other_problem", count: 2 },
      { problem: "nivel_tech_cliente", count: 1 },
    ],
    equipment: {
      own: { count: 119, percent: 37.66 },
      external: { count: 197, percent: 62.34 },
      total_items: 316,
    },
    crm_test: {
      count: 1,
      percent_of_total: 0.72,
      with_motivo: 1,
      breakdown_by_type: { configuracion: 1, auditoria: 0, noshow: 0 },
      motivos: [
        {
          motivo:
            "Sin foto de AnyDesk, y la impresora EPSON es Wifi+Bluetooth, y ninguna conexion compatible",
          count: 1,
        },
      ],
    },
  },
};

describe("hwtool mapper — v1.0.0 (compat retro)", () => {
  it("parsea payload v1.0.0 (sin crm_test)", () => {
    const parsed = hwToolApiResponseSchema.parse(PAYLOAD_V1_0_0);
    expect(parsed.principal.total_sessions).toBe(136);
  });

  it("mapea snake_case → camelCase manteniendo valores", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_0_0);
    expect(m.principal.totalSessions).toBe(136);
    expect(m.principal.configuracion).toBe(118);
    expect(m.detailed.configOk.count).toBe(79);
    expect(m.detailed.configOk.percentOfTotal).toBe(58.09);
    expect(m.detailed.configRequires2nd.count).toBe(22);
    expect(m.equipment.totalItems).toBe(308);
  });

  it("calcula successRateFirstTry = (config_ok + config_pnp) / configuracion", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_0_0);
    // (79 + 17) / 118 = 0.81355... → 81.4%
    expect(m.successRateFirstTry).toBe(81.4);
  });

  it("calcula secondConfigRate = config_requires_2nd / configuracion", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_0_0);
    // 22 / 118 = 0.18644... → 18.6%
    expect(m.secondConfigRate).toBe(18.6);
  });

  it("etiqueta los problemas en español", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_0_0);
    const p = m.problems.find((x) => x.key === "no_problem");
    expect(p?.label).toBe("Sin problemas");
    expect(p?.count).toBe(85);
  });

  it("evita división por cero cuando configuracion=0", () => {
    const empty = {
      ...PAYLOAD_V1_0_0,
      principal: {
        ...PAYLOAD_V1_0_0.principal,
        breakdown: { configuracion: 0, auditoria: 0, noshow: 0 },
      },
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

  it("crmTest es null cuando la API no devuelve additional.crm_test (v1.0.0)", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_0_0);
    expect(m.crmTest).toBeNull();
  });

  it("acepta claves de problemas no mapeadas y les da fallback legible", () => {
    const withUnknown = {
      ...PAYLOAD_V1_0_0,
      additional: {
        ...PAYLOAD_V1_0_0.additional,
        problems_in_configs: [
          ...PAYLOAD_V1_0_0.additional.problems_in_configs,
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

describe("hwtool mapper — v1.1.0 (con crm_test ampliado)", () => {
  it("parsea payload v1.1.0", () => {
    const parsed = hwToolApiResponseSchema.parse(PAYLOAD_V1_1_0);
    expect(parsed.schema_version).toBe("1.1.0");
    expect(parsed.additional.crm_test?.count).toBe(1);
  });

  it("expone schemaVersion en el shape interno", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_1_0);
    expect(m.schemaVersion).toBe("1.1.0");
  });

  it("mapea additional.crm_test → camelCase", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_1_0);
    expect(m.crmTest).not.toBeNull();
    expect(m.crmTest?.count).toBe(1);
    expect(m.crmTest?.percentOfTotal).toBe(0.72);
    expect(m.crmTest?.withMotivo).toBe(1);
    expect(m.crmTest?.breakdownByType).toEqual({
      configuracion: 1,
      auditoria: 0,
      noshow: 0,
    });
    expect(m.crmTest?.motivos[0]?.count).toBe(1);
    expect(m.crmTest?.motivos[0]?.motivo).toContain("AnyDesk");
  });

  it("filters.crmTest se preserva (null cuando no se filtra)", () => {
    const m = mapHwToolResponse(PAYLOAD_V1_1_0);
    expect(m.filters.crmTest).toBeNull();
  });

  it("CRM test SE INCLUYE en el cálculo de successRateFirstTry", () => {
    // El 1 CRM test del breakdown_by_type.configuracion ya está sumado dentro
    // de principal.breakdown.configuracion (= 121). Si fuera config_ok + pnp
    // y NO requiriera 2ª, ya cuenta como éxito. La fórmula no lo excluye.
    const m = mapHwToolResponse(PAYLOAD_V1_1_0);
    // (80 + 17) / 121 = 0.80165... → 80.2%
    expect(m.successRateFirstTry).toBe(80.2);
    // 24 / 121 = 0.19834... → 19.8%
    expect(m.secondConfigRate).toBe(19.8);
  });
});
