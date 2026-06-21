import { describe, it, expect, vi } from "vitest";

import { buildEmptyContent, parseReportContent } from "./defaults";
import { reportContentSchemaV1 } from "./schema";

describe("buildEmptyContent", () => {
  it("produce un content válido contra reportContentSchemaV1", () => {
    const empty = buildEmptyContent();
    expect(reportContentSchemaV1.safeParse(empty).success).toBe(true);
    expect(empty._version).toBe(1);
  });
});

describe("parseReportContent", () => {
  it("devuelve el content tal cual cuando es válido", () => {
    const valid = buildEmptyContent();
    const parsed = parseReportContent(valid);
    expect(parsed).toEqual(valid);
  });

  it("cae a content vacío (sin throw) cuando el content está malformado", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // tesis debe ser un objeto { doc }, no un string → malformado
    const malformed = { _version: 1, tesis: "no soy un objeto válido" };
    const parsed = parseReportContent(malformed);
    expect(parsed).toEqual(buildEmptyContent());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("cae a content vacío cuando recibe null o undefined", () => {
    expect(parseReportContent(null)).toEqual(buildEmptyContent());
    expect(parseReportContent(undefined)).toEqual(buildEmptyContent());
  });
});
