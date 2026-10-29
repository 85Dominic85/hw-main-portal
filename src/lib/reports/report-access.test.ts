import { describe, expect, it } from "vitest";

import { canExportPerformancePdf, canSeePerformance } from "./report-access";

describe("canSeePerformance (pantalla, editor, Markdown, Notion)", () => {
  it("solo JJ", () => {
    expect(canSeePerformance("jj.gallego@qamarero.com")).toBe(true);
    expect(canSeePerformance("domingo.bueno@qamarero.com")).toBe(false);
    expect(canSeePerformance("guillermo.mateos@qamarero.com")).toBe(false);
    expect(canSeePerformance(null)).toBe(false);
  });
});

describe("canExportPerformancePdf (solo el PDF descargado)", () => {
  it("JJ y Domingo", () => {
    expect(canExportPerformancePdf("jj.gallego@qamarero.com")).toBe(true);
    expect(canExportPerformancePdf("domingo.bueno@qamarero.com")).toBe(true);
  });

  it("normaliza mayúsculas y espacios", () => {
    expect(canExportPerformancePdf("  Domingo.Bueno@Qamarero.com ")).toBe(true);
  });

  it("nadie más", () => {
    expect(canExportPerformancePdf("guillermo.mateos@qamarero.com")).toBe(false);
    expect(canExportPerformancePdf("")).toBe(false);
    expect(canExportPerformancePdf(undefined)).toBe(false);
  });
});
