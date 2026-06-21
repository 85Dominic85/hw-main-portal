import { describe, it, expect } from "vitest";

import { mapHsmResponse } from "./mapper";
import { hsmApiResponseSchema } from "./schema";

/**
 * Payload sintético siguiendo `docs/connectors/hsm-endpoint-spec.md` (sección 5).
 * Golden master hasta que tengamos una respuesta real del endpoint HSM.
 */
const SAMPLE_PAYLOAD = {
  generated_at: "2026-04-30T13:00:00.000Z",
  schema_version: "1.0.0",
  filters: {
    from: "2026-04-01",
    to: "2026-04-30",
    prev_from: "2026-03-02",
    prev_to: "2026-03-31",
  },
  current: {
    open_incidents: 24,
    active_rmas: 8,
    sla_compliance_pct: 67.5,
    overdue_count: 4,
    avg_resolution_hours: 18.4,
    reopen_rate_pct: 2.3,
    avg_rma_turnaround_days: 5.2,
    critical_in_sla_pct: 92.0,
    throughput_ratio: 0.85,
    incidents_by_priority: [
      { priority: "critica", count: 13 },
      { priority: "alta", count: 28 },
      { priority: "media", count: 41 },
      { priority: "baja", count: 19 },
    ],
    aging_distribution: [
      { bucket: "lt_1d", count: 6 },
      { bucket: "1_3d", count: 9 },
      { bucket: "3_7d", count: 5 },
      { bucket: "gt_7d", count: 4 },
    ],
    top_providers: [
      {
        provider_id: "p1",
        provider_name: "Acme S.A.",
        rma_count: 12,
        success_rate_pct: 83.3,
        avg_turnaround_days: 4.8,
      },
      {
        provider_id: "p2",
        provider_name: "Globex Ltd.",
        rma_count: 8,
        success_rate_pct: 75.0,
        avg_turnaround_days: 6.1,
      },
    ],
  },
  previous: {
    sla_compliance_pct: 62.3,
    avg_resolution_hours: 21.0,
    reopen_rate_pct: 3.1,
    open_incidents_at_close: 28,
  },
};

describe("hsmApiResponseSchema", () => {
  it("acepta el payload sintético del spec", () => {
    const parsed = hsmApiResponseSchema.safeParse(SAMPLE_PAYLOAD);
    expect(parsed.success).toBe(true);
  });

  it("acepta sla_compliance_pct > 100 (sin .max: defensivo ante bugs upstream en ratios)", () => {
    const overflow = {
      ...SAMPLE_PAYLOAD,
      current: { ...SAMPLE_PAYLOAD.current, sla_compliance_pct: 150 },
    };
    const parsed = hsmApiResponseSchema.safeParse(overflow);
    expect(parsed.success).toBe(true);
  });

  it("rechaza sla_compliance_pct negativo", () => {
    const bad = {
      ...SAMPLE_PAYLOAD,
      current: { ...SAMPLE_PAYLOAD.current, sla_compliance_pct: -5 },
    };
    const parsed = hsmApiResponseSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it("acepta avg_resolution_hours = null (sin resueltos en el periodo)", () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      current: { ...SAMPLE_PAYLOAD.current, avg_resolution_hours: null },
      previous: { ...SAMPLE_PAYLOAD.previous, avg_resolution_hours: null },
    };
    const parsed = hsmApiResponseSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("acepta critical_in_sla_pct = null (sin críticas en el periodo)", () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      current: { ...SAMPLE_PAYLOAD.current, critical_in_sla_pct: null },
    };
    const parsed = hsmApiResponseSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rechaza aging_distribution con bucket desconocido", () => {
    // Casteamos a unknown para escapar al narrow del literal type — la prueba
    // verifica precisamente que Zod rechace en runtime un bucket no permitido.
    const bad: unknown = {
      ...SAMPLE_PAYLOAD,
      current: {
        ...SAMPLE_PAYLOAD.current,
        aging_distribution: [{ bucket: "20d_plus", count: 5 }],
      },
    };
    const parsed = hsmApiResponseSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it("ignora campos extra que HSM añada en el futuro (forward compat)", () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      current: {
        ...SAMPLE_PAYLOAD.current,
        future_field: { foo: "bar" },
      },
      future_top_level: 42,
    };
    const parsed = hsmApiResponseSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });
});

describe("mapHsmResponse", () => {
  // Parseamos una vez con el schema para que el tipo del input al mapper sea
  // el inferido de Zod (con buckets enum estrictos), no el `string` ancho que
  // TypeScript infiere de un object literal sin anotación.
  const SAMPLE_PARSED = hsmApiResponseSchema.parse(SAMPLE_PAYLOAD);

  it("transforma snake_case → camelCase", () => {
    const m = mapHsmResponse(SAMPLE_PARSED);
    expect(m.current.openIncidents).toBe(24);
    expect(m.current.activeRmas).toBe(8);
    expect(m.current.slaCompliancePct).toBe(67.5);
    expect(m.current.overdueCount).toBe(4);
    expect(m.current.avgResolutionHours).toBe(18.4);
    expect(m.current.reopenRatePct).toBe(2.3);
    expect(m.current.avgRmaTurnaroundDays).toBe(5.2);
    expect(m.current.criticalInSlaPct).toBe(92.0);
    expect(m.current.throughputRatio).toBe(0.85);
  });

  it("convierte ISO strings de filters a Date", () => {
    const m = mapHsmResponse(SAMPLE_PARSED);
    expect(m.range.from).toBeInstanceOf(Date);
    expect(m.range.to).toBeInstanceOf(Date);
    expect(m.range.prevFrom).toBeInstanceOf(Date);
    expect(m.range.prevTo).toBeInstanceOf(Date);
    expect(m.range.from.toISOString().slice(0, 10)).toBe("2026-04-01");
    expect(m.range.prevFrom.toISOString().slice(0, 10)).toBe("2026-03-02");
  });

  it("calcula slaDeltaPp = current − previous con 1 decimal", () => {
    const m = mapHsmResponse(SAMPLE_PARSED);
    // 67.5 − 62.3 = 5.2
    expect(m.slaDeltaPp).toBe(5.2);
  });

  it("slaDeltaPp negativo cuando empeora", () => {
    const payload = hsmApiResponseSchema.parse({
      ...SAMPLE_PAYLOAD,
      current: { ...SAMPLE_PAYLOAD.current, sla_compliance_pct: 60 },
      previous: { ...SAMPLE_PAYLOAD.previous, sla_compliance_pct: 65 },
    });
    const m = mapHsmResponse(payload);
    expect(m.slaDeltaPp).toBe(-5);
  });

  it("preserva orden de incidents_by_priority y aging_distribution", () => {
    const m = mapHsmResponse(SAMPLE_PARSED);
    expect(m.current.incidentsByPriority.map((x) => x.priority)).toEqual([
      "critica",
      "alta",
      "media",
      "baja",
    ]);
    expect(m.current.agingDistribution.map((x) => x.bucket)).toEqual([
      "lt_1d",
      "1_3d",
      "3_7d",
      "gt_7d",
    ]);
  });

  it("mapea topProviders con success_rate y turnaround", () => {
    const m = mapHsmResponse(SAMPLE_PARSED);
    expect(m.current.topProviders).toHaveLength(2);
    expect(m.current.topProviders[0]).toEqual({
      providerId: "p1",
      providerName: "Acme S.A.",
      rmaCount: 12,
      successRatePct: 83.3,
      avgTurnaroundDays: 4.8,
    });
  });

  it("preserva null en avgRmaTurnaroundDays si no hay datos", () => {
    const payload: unknown = {
      ...SAMPLE_PAYLOAD,
      current: {
        ...SAMPLE_PAYLOAD.current,
        avg_rma_turnaround_days: null,
        top_providers: [
          {
            provider_id: "p1",
            provider_name: "Acme",
            rma_count: 5,
            success_rate_pct: 80,
            avg_turnaround_days: null,
          },
        ],
      },
    };
    const parsed = hsmApiResponseSchema.parse(payload);
    const m = mapHsmResponse(parsed);
    expect(m.current.avgRmaTurnaroundDays).toBeNull();
    expect(m.current.topProviders[0]?.avgTurnaroundDays).toBeNull();
  });

  // ─── Carga oculta — quick_consultations (HSM v1.1.0+) ────────────────────

  it("mapea quick_consultations cuando HSM devuelve el bloque", () => {
    const payload: unknown = {
      ...SAMPLE_PAYLOAD,
      current: {
        ...SAMPLE_PAYLOAD.current,
        quick_consultations: {
          count: 12,
          total_minutes: 95,
          avg_minutes: 7.9,
          by_technician: [
            { name: "Domi", count: 7, total_minutes: 60 },
            { name: "Guille", count: 5, total_minutes: 35 },
          ],
          conversion_rate_pct: 16.7,
        },
      },
      previous: {
        ...SAMPLE_PAYLOAD.previous,
        quick_consultations: { count: 8, total_minutes: 50 },
      },
    };
    const parsed = hsmApiResponseSchema.parse(payload);
    const m = mapHsmResponse(parsed);

    expect(m.current.quickConsultations).not.toBeNull();
    expect(m.current.quickConsultations?.count).toBe(12);
    expect(m.current.quickConsultations?.totalMinutes).toBe(95);
    expect(m.current.quickConsultations?.avgMinutes).toBe(7.9);
    expect(m.current.quickConsultations?.conversionRatePct).toBe(16.7);
    expect(m.current.quickConsultations?.byTechnician).toHaveLength(2);
    expect(m.current.quickConsultations?.byTechnician[0]).toEqual({
      name: "Domi",
      count: 7,
      totalMinutes: 60,
    });

    expect(m.previous.quickConsultations).not.toBeNull();
    expect(m.previous.quickConsultations?.count).toBe(8);
    expect(m.previous.quickConsultations?.totalMinutes).toBe(50);
  });

  it("quick_consultations = null cuando HSM aún no expone el bloque (retro-compat)", () => {
    // SAMPLE_PAYLOAD no tiene quick_consultations → simulamos HSM v1.0.0.
    const parsed = hsmApiResponseSchema.parse(SAMPLE_PAYLOAD);
    const m = mapHsmResponse(parsed);
    expect(m.current.quickConsultations).toBeNull();
    expect(m.previous.quickConsultations).toBeNull();
  });

  it("acepta quick_consultations.avg_minutes = null (sin tiempo registrado)", () => {
    const payload: unknown = {
      ...SAMPLE_PAYLOAD,
      current: {
        ...SAMPLE_PAYLOAD.current,
        quick_consultations: {
          count: 3,
          total_minutes: 0,
          avg_minutes: null,
          by_technician: [],
          conversion_rate_pct: 0,
        },
      },
    };
    const parsed = hsmApiResponseSchema.parse(payload);
    const m = mapHsmResponse(parsed);
    expect(m.current.quickConsultations?.avgMinutes).toBeNull();
    expect(m.current.quickConsultations?.byTechnician).toHaveLength(0);
  });
});
