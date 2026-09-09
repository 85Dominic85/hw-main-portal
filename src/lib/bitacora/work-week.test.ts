import { describe, it, expect } from "vitest";

import { formatWeekLabel, isoWeekToRange } from "@/lib/reports/iso-week";
import {
  WORK_DAYS_PER_WEEK,
  dowShortLabel,
  formatWorkWeekLabel,
  isWeekendDow,
  toDateKey,
  weekCaptureRange,
  workDayKeys,
  workDays,
} from "./work-week";

// W36-2026 = lunes 31 ago → domingo 6 sep 2026. Viernes = 4 sep.
const YEAR = 2026;
const WEEK = 36;

describe("workDays", () => {
  it("devuelve exactamente 5 días", () => {
    expect(workDays(YEAR, WEEK)).toHaveLength(WORK_DAYS_PER_WEEK);
  });

  it("empieza en lunes y acaba en viernes", () => {
    const days = workDays(YEAR, WEEK);
    // getUTCDay: 1=lunes, 5=viernes
    expect(days[0]?.getUTCDay()).toBe(1);
    expect(days[4]?.getUTCDay()).toBe(5);
  });

  it("son 5 días consecutivos a medianoche UTC", () => {
    const keys = workDayKeys(YEAR, WEEK);
    expect(keys).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
    for (const d of workDays(YEAR, WEEK)) {
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
    }
  });

  it("nunca incluye sábado ni domingo", () => {
    // Barrido de un año completo: ninguna semana debe colar fin de semana.
    for (let week = 1; week <= 52; week++) {
      for (const d of workDays(YEAR, week)) {
        const dow = ((d.getUTCDay() + 6) % 7) + 1;
        expect(isWeekendDow(dow)).toBe(false);
      }
    }
  });
});

describe("weekCaptureRange", () => {
  it("el rango de captura SÍ llega hasta el domingo", () => {
    // A propósito: si cortara en viernes, una urgencia del sábado caería
    // en un agujero entre semanas y se perdería.
    const range = weekCaptureRange(YEAR, WEEK);
    expect(toDateKey(range.from)).toBe("2026-08-31");
    expect(toDateKey(range.to)).toBe("2026-09-06");
    expect(range.to.getUTCDay()).toBe(0); // domingo
  });

  it("coincide con isoWeekToRange — no reimplementa el cálculo", () => {
    expect(weekCaptureRange(YEAR, WEEK)).toEqual(isoWeekToRange(YEAR, WEEK));
  });

  it("el rango de captura es más ancho que los días de presentación", () => {
    const capture = weekCaptureRange(YEAR, WEEK);
    const lastWorkDay = workDays(YEAR, WEEK)[4];
    expect(capture.to.getTime()).toBeGreaterThan(lastWorkDay!.getTime());
  });
});

describe("formatWorkWeekLabel", () => {
  it("cierra en viernes, no en domingo", () => {
    const label = formatWorkWeekLabel(YEAR, WEEK);
    expect(label).toContain("Semana 36");
    expect(label).toContain("31 ago");
    expect(label).toContain("4 sept");
    expect(label).not.toContain("6 sept");
  });

  it("NO coincide con formatWeekLabel de informes — son etiquetas distintas a propósito", () => {
    // Si estas dos se igualan, alguien ha tocado iso-week.ts y ha
    // reetiquetado los informes históricos ya publicados.
    expect(formatWorkWeekLabel(YEAR, WEEK)).not.toBe(formatWeekLabel(YEAR, WEEK));
    expect(formatWeekLabel(YEAR, WEEK)).toContain("6 sept");
  });
});

describe("semanas a caballo entre años", () => {
  it("la última semana de 2026 empieza en lunes y tiene 5 laborables", () => {
    // 28 dic 2026 es lunes → W53 de 2026.
    const days = workDays(2026, 53);
    expect(days).toHaveLength(5);
    expect(days[0]?.getUTCDay()).toBe(1);
    expect(toDateKey(days[0]!)).toBe("2026-12-28");
    // El viernes de esa semana ya cae en enero de 2027.
    expect(toDateKey(days[4]!)).toBe("2027-01-01");
  });

  it("W1 de 2026 arranca en diciembre de 2025", () => {
    expect(workDayKeys(2026, 1)[0]).toBe("2025-12-29");
  });
});

describe("isWeekendDow", () => {
  it("solo sábado (6) y domingo (7)", () => {
    expect([1, 2, 3, 4, 5].map(isWeekendDow)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(isWeekendDow(6)).toBe(true);
    expect(isWeekendDow(7)).toBe(true);
  });
});

describe("dowShortLabel", () => {
  it("etiqueta los 5 laborables en orden", () => {
    expect([1, 2, 3, 4, 5].map(dowShortLabel)).toEqual([
      "LUN",
      "MAR",
      "MIÉ",
      "JUE",
      "VIE",
    ]);
  });

  it("un día fuera de rango no revienta", () => {
    expect(dowShortLabel(0)).toBe("—");
    expect(dowShortLabel(9)).toBe("—");
  });
});
