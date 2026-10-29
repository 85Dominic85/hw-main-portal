import { describe, expect, it, vi } from "vitest";

import type { Report } from "@/lib/db/schema/reports";
import { buildEmptyContent } from "./defaults";
import { reportPeriodLabel, toExternalReport, toExternalReportSummary } from "./external";

function makeReport(overrides: Partial<Report> = {}): Report {
  const content = buildEmptyContent();
  content.performance.members[0]!.narrative = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Buen trimestre" }] }],
  };
  return {
    id: "6f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f",
    type: "weekly",
    periodKey: "W36-2026",
    periodFrom: "2026-08-31",
    periodTo: "2026-09-06",
    isoYear: 2026,
    isoWeek: 36,
    status: "draft",
    globalStatus: "verde",
    title: "W36 — Hardware",
    content,
    kpiSnapshot: null,
    contentVersion: 1,
    parentReportId: null,
    createdBy: null,
    publishedBy: null,
    publishedAt: null,
    createdAt: new Date("2026-09-07T08:00:00Z"),
    updatedAt: new Date("2026-09-08T10:30:00Z"),
    ...overrides,
  };
}

describe("reportPeriodLabel", () => {
  it("usa la etiqueta de semana para los semanales", () => {
    expect(reportPeriodLabel(makeReport())).not.toBe("W36-2026");
  });

  it("usa el periodKey tal cual para los mensuales", () => {
    const monthly = makeReport({ type: "monthly", periodKey: "2026-05", isoYear: null, isoWeek: null });
    expect(reportPeriodLabel(monthly)).toBe("2026-05");
  });
});

describe("toExternalReportSummary", () => {
  it("serializa fechas a ISO y deja publishedAt a null en borradores", () => {
    const summary = toExternalReportSummary(makeReport());
    expect(summary.updatedAt).toBe("2026-09-08T10:30:00.000Z");
    expect(summary.publishedAt).toBeNull();
    expect(summary.status).toBe("draft");
  });
});

describe("toExternalReport", () => {
  it("incluye el Markdown con la sección Performance", () => {
    const report = toExternalReport(makeReport());
    expect(report.markdown).toContain("W36 — Hardware");
    expect(report.markdown).toContain("Performance del equipo");
    expect(report.markdown).toContain("Buen trimestre");
  });

  it("incluye el contenido estructurado y kpiSnapshot null si no hay", () => {
    const report = toExternalReport(makeReport());
    expect(report.content.performance.members).toHaveLength(3);
    expect(report.kpiSnapshot).toBeNull();
  });

  it("no falla con contenido malformado (cae a contenido vacío)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const report = toExternalReport(makeReport({ content: { tesis: "malformado" } }));
    expect(report.markdown).toContain("W36 — Hardware");
    warn.mockRestore();
  });
});
