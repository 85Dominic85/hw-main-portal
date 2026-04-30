import { describe, it, expect } from "vitest";

import { mapMainOpsResponse } from "./mapper";
import { mainOpsApiResponseSchema } from "./schema";

/**
 * Payload sintético que sigue el contrato de `docs/HW_MAIN_PORTAL_API.md`
 * de MainOps. Sirve de golden master hasta que tengamos un payload real
 * (la API aún no está desplegada en `/api/external/metrics`).
 */
const SAMPLE_PAYLOAD = {
  generated_at: "2026-04-29T16:00:00.000Z",
  range: { from: "2026-04-01", to: "2026-04-29" },
  kpis: {
    total_orders: 87,
    total_revenue: 56230.5,
    avg_order_value: 646.33,
    completed_rate: 0.74,
  },
  comparison: {
    prev_total_orders: 71,
    prev_total_revenue: 48120.0,
    prev_avg_order_value: 678.0,
    prev_completed_rate: 0.69,
  },
  time_series: {
    orders_by_date: [
      { date: "2026-04-28", count: 4, revenue: 2540.0 },
      { date: "2026-04-29", count: 6, revenue: 4120.5 },
    ],
  },
  breakdowns: {
    by_purchase_type: [
      { purchase_type: "kit_digital", count: 38, revenue: 18900.0 },
      { purchase_type: "hardware_one_off", count: 27, revenue: 22130.5 },
      { purchase_type: "hardware_financiacion", count: 12, revenue: 11200.0 },
      { purchase_type: "transferencias_saas", count: 8, revenue: 4000.0 },
      { purchase_type: "otro", count: 2, revenue: 0 },
    ],
    by_status: [
      { status: "completado", count: 64 },
      { status: "enviado", count: 12 },
      { status: "pendiente", count: 8 },
      { status: "bloqueado", count: 3 },
    ],
    by_product: [
      { product_name: "TPV bartec 9.5", total_qty: 28, order_count: 22 },
      { product_name: "KDS Cocina 15", total_qty: 19, order_count: 17 },
    ],
  },
  sla: {
    total_delivered: 76,
    avg_delivery_days: 4.3,
    on_time_pct: 0.92,
    breached_count: 6,
    active_at_risk: 3,
    sla_by_week: [
      { week_start: "2026-04-20", count: 18, avg_days: 3.9, on_time_pct: 0.94 },
      { week_start: "2026-04-27", count: 9, avg_days: 4.1, on_time_pct: 0.89 },
    ],
  },
  recent_orders: [
    {
      operation_id: "HW-202604-1748",
      created_at: "2026-04-29T14:23:00.000Z",
      customer_name: "El Cau Melia",
      venue_name: "El Cau Restaurant",
      purchase_type: "hardware_one_off" as const,
      amount: 1240.5,
      status: "enviado" as const,
      tracking_number: "TIPSA-998877",
    },
    {
      operation_id: "HW-202604-1747",
      created_at: "2026-04-29T11:00:00.000Z",
      customer_name: "Bar Lola",
      venue_name: null,
      purchase_type: null,
      amount: null,
      status: "nuevo" as const,
      tracking_number: null,
    },
  ],
};

describe("mainops mapper", () => {
  it("parsea el payload de ejemplo del briefing", () => {
    const parsed = mainOpsApiResponseSchema.parse(SAMPLE_PAYLOAD);
    expect(parsed.kpis.total_orders).toBe(87);
  });

  it("mapea snake_case → camelCase manteniendo valores", () => {
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.kpis.totalOrders).toBe(87);
    expect(m.kpis.totalRevenueEur).toBe(56230.5);
    expect(m.kpis.avgOrderValueEur).toBe(646.33);
    expect(m.kpis.completedRate).toBe(0.74);
    expect(m.sla.onTimePct).toBe(0.92);
    expect(m.sla.totalDelivered).toBe(76);
  });

  it("convierte ISO timestamps a Date en generatedAt y range", () => {
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.generatedAt).toBeInstanceOf(Date);
    expect(m.range.from).toBeInstanceOf(Date);
    expect(m.range.to).toBeInstanceOf(Date);
  });

  it("mapea recent_orders con createdAt como Date y purchaseType nullable", () => {
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.recentOrders[0]?.createdAt).toBeInstanceOf(Date);
    expect(m.recentOrders[0]?.operationId).toBe("HW-202604-1748");
    expect(m.recentOrders[1]?.purchaseType).toBeNull();
    expect(m.recentOrders[1]?.amountEur).toBeNull();
  });

  it("mapea comparison cuando existe y null cuando no", () => {
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.comparison?.prevTotalOrders).toBe(71);

    const noComp = { ...SAMPLE_PAYLOAD, comparison: null };
    const m2 = mapMainOpsResponse(noComp);
    expect(m2.comparison).toBeNull();
  });

  it("mapea breakdowns by_purchase_type / by_status / by_product", () => {
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.breakdowns.byPurchaseType).toHaveLength(5);
    expect(m.breakdowns.byPurchaseType[0]?.purchaseType).toBe("kit_digital");
    expect(m.breakdowns.byStatus).toHaveLength(4);
    expect(m.breakdowns.byProduct[0]?.productName).toBe("TPV bartec 9.5");
  });

  it("preserva el orden y datos de sla.byWeek (formato ratio 0-1)", () => {
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.sla.byWeek).toHaveLength(2);
    expect(m.sla.byWeek[0]?.weekStart).toBe("2026-04-20");
    expect(m.sla.byWeek[0]?.onTimePct).toBe(0.94);
  });
});

describe("mainops mapper — normalización rate/pct (0-100 vs 0-1)", () => {
  // Payload real de prod (29-04-2026) — la API devuelve 0-100 a pesar de que
  // el doc canónico dice 0-1. El mapper debe normalizar a 0-1 internamente.
  const PROD_PAYLOAD_0_TO_100 = {
    ...SAMPLE_PAYLOAD,
    kpis: {
      ...SAMPLE_PAYLOAD.kpis,
      completed_rate: 0, // mismo en ambas escalas
    },
    comparison: { ...SAMPLE_PAYLOAD.comparison!, prev_completed_rate: 0 },
    sla: {
      ...SAMPLE_PAYLOAD.sla,
      on_time_pct: 55.2, // claramente 0-100
      sla_by_week: [
        { week_start: "2026-04-06", count: 3, avg_days: 1.6, on_time_pct: 100 },
        { week_start: "2026-04-13", count: 32, avg_days: 17.1, on_time_pct: 34.4 },
        { week_start: "2026-04-20", count: 22, avg_days: 7.4, on_time_pct: 63.6 },
        { week_start: "2026-04-27", count: 10, avg_days: 3.9, on_time_pct: 90 },
      ],
    },
  };

  it("acepta payload con on_time_pct en 0-100 (formato real de prod)", () => {
    const m = mapMainOpsResponse(PROD_PAYLOAD_0_TO_100);
    // 55.2 → 0.552 (ratio interno)
    expect(m.sla.onTimePct).toBeCloseTo(0.552, 4);
  });

  it("normaliza on_time_pct=100 a 1.0 (caso máximo)", () => {
    const m = mapMainOpsResponse(PROD_PAYLOAD_0_TO_100);
    expect(m.sla.byWeek[0]?.onTimePct).toBe(1);
  });

  it("normaliza valores intermedios de byWeek correctamente", () => {
    const m = mapMainOpsResponse(PROD_PAYLOAD_0_TO_100);
    expect(m.sla.byWeek[1]?.onTimePct).toBeCloseTo(0.344, 4);
    expect(m.sla.byWeek[2]?.onTimePct).toBeCloseTo(0.636, 4);
    expect(m.sla.byWeek[3]?.onTimePct).toBe(0.9);
  });

  it("mantiene compat retroactiva con formato ratio 0-1 (doc canónico)", () => {
    // SAMPLE_PAYLOAD tiene 0.92, 0.94, 0.89 — ya son ratios.
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.sla.onTimePct).toBe(0.92);
    expect(m.sla.byWeek[0]?.onTimePct).toBe(0.94);
  });

  it("normaliza completed_rate cuando viene en 0-100", () => {
    const payload = {
      ...SAMPLE_PAYLOAD,
      kpis: { ...SAMPLE_PAYLOAD.kpis, completed_rate: 78 },
    };
    const m = mapMainOpsResponse(payload);
    expect(m.kpis.completedRate).toBe(0.78);
  });

  it("trata `1` exacto como ratio (no como 1%)", () => {
    // Caso degenerado: v=1 puede ser "100%" o "1%". Asumimos 100%.
    const payload = {
      ...SAMPLE_PAYLOAD,
      sla: { ...SAMPLE_PAYLOAD.sla, on_time_pct: 1 },
    };
    const m = mapMainOpsResponse(payload);
    expect(m.sla.onTimePct).toBe(1);
  });
});

describe("mainops mapper — bloque ops (CHANGELOG 2026-04-30)", () => {
  // Payload real obtenido vía curl 2026-04-30 con periodo abril.
  const PAYLOAD_WITH_OPS = {
    ...SAMPLE_PAYLOAD,
    ops: {
      total_shipped: 24,
      total_completed: 71,
      avg_handling_days: 11.2,
      avg_transit_days: 2.6,
      on_time_shipping_pct: 73.7,
      throughput_by_week: [
        { week_start: "2026-03-30", created: 1, shipped: 0, delivered: 0 },
        { week_start: "2026-04-06", created: 19, shipped: 0, delivered: 3 },
        { week_start: "2026-04-13", created: 18, shipped: 0, delivered: 32 },
        { week_start: "2026-04-20", created: 14, shipped: 11, delivered: 22 },
        { week_start: "2026-04-27", created: 14, shipped: 13, delivered: 14 },
      ],
      blocked_count: 0,
      excluded_admin: 16,
    },
  };

  it("mapea ops cuando está presente (camelCase + normalize del pct)", () => {
    const m = mapMainOpsResponse(PAYLOAD_WITH_OPS);
    expect(m.ops).not.toBeNull();
    expect(m.ops?.totalShipped).toBe(24);
    expect(m.ops?.totalCompleted).toBe(71);
    expect(m.ops?.avgHandlingDays).toBe(11.2);
    expect(m.ops?.avgTransitDays).toBe(2.6);
    // 73.7 → 0.737 (normalize 0-100 → 0-1)
    expect(m.ops?.onTimeShippingPct).toBeCloseTo(0.737, 4);
    expect(m.ops?.blockedCount).toBe(0);
    expect(m.ops?.excludedAdmin).toBe(16);
  });

  it("ops es null cuando la API no lo devuelve (compat retro pre-2026-04-30)", () => {
    // SAMPLE_PAYLOAD original no tiene `ops`.
    const m = mapMainOpsResponse(SAMPLE_PAYLOAD);
    expect(m.ops).toBeNull();
  });

  it("preserva el orden y datos de throughputByWeek (5 semanas)", () => {
    const m = mapMainOpsResponse(PAYLOAD_WITH_OPS);
    expect(m.ops?.throughputByWeek).toHaveLength(5);
    expect(m.ops?.throughputByWeek[0]?.weekStart).toBe("2026-03-30");
    expect(m.ops?.throughputByWeek[3]?.shipped).toBe(11);
    expect(m.ops?.throughputByWeek[4]?.delivered).toBe(14);
  });

  it("on_time_shipping_pct normaliza correctamente a 100% y a 0", () => {
    const at100 = {
      ...PAYLOAD_WITH_OPS,
      ops: { ...PAYLOAD_WITH_OPS.ops, on_time_shipping_pct: 100 },
    };
    const at0 = {
      ...PAYLOAD_WITH_OPS,
      ops: { ...PAYLOAD_WITH_OPS.ops, on_time_shipping_pct: 0 },
    };
    expect(mapMainOpsResponse(at100).ops?.onTimeShippingPct).toBe(1);
    expect(mapMainOpsResponse(at0).ops?.onTimeShippingPct).toBe(0);
  });
});
