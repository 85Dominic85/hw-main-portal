import { describe, it, expect } from "vitest";

import {
  MAX_TAGS_PER_ENTRY,
  MAX_TAG_LENGTH,
  normalizeTag,
  normalizeTags,
} from "./tags";

describe("normalizeTag", () => {
  it("quita la almohadilla y pasa a minúsculas", () => {
    expect(normalizeTag("#KDS")).toBe("kds");
    expect(normalizeTag("##kds")).toBe("kds");
  });

  it("recorta espacios sobrantes", () => {
    expect(normalizeTag("  KDS  ")).toBe("kds");
  });

  it("elimina diacríticos", () => {
    expect(normalizeTag("Configuración")).toBe("configuracion");
    expect(normalizeTag("instalación")).toBe("instalacion");
  });

  it("convierte separadores en guiones", () => {
    expect(normalizeTag("Bar Pepe")).toBe("bar-pepe");
    expect(normalizeTag("bar_pepe")).toBe("bar-pepe");
    expect(normalizeTag("bar   pepe")).toBe("bar-pepe");
  });

  it("no deja guiones colgando en los extremos", () => {
    expect(normalizeTag("-kds-")).toBe("kds");
    expect(normalizeTag("  #  kds  ")).toBe("kds");
  });

  it("devuelve cadena vacía cuando no queda nada utilizable", () => {
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag("#")).toBe("");
    expect(normalizeTag("   ")).toBe("");
    expect(normalizeTag("---")).toBe("");
  });

  it("recorta a la longitud máxima sin dejar guión final", () => {
    const tag = normalizeTag("a".repeat(MAX_TAG_LENGTH + 10));
    expect(tag).toHaveLength(MAX_TAG_LENGTH);

    // El corte cae justo donde habría un guión → no debe quedar colgando.
    const cut = normalizeTag(`${"a".repeat(MAX_TAG_LENGTH - 1)} bcd`);
    expect(cut.endsWith("-")).toBe(false);
  });

  it("las tres formas que un humano escribiría convergen en la misma etiqueta", () => {
    const forms = ["#KDS", "kds", " KDS "];
    const normalized = new Set(forms.map(normalizeTag));
    expect(normalized).toEqual(new Set(["kds"]));
  });
});

describe("normalizeTags", () => {
  it("deduplica preservando el orden de aparición", () => {
    expect(normalizeTags(["#KDS", "incidencia", "kds"])).toEqual([
      "kds",
      "incidencia",
    ]);
  });

  it("descarta las vacías", () => {
    expect(normalizeTags(["kds", "", "  ", "#"])).toEqual(["kds"]);
  });

  it("recorta al máximo por entrada", () => {
    const many = Array.from({ length: MAX_TAGS_PER_ENTRY + 5 }, (_, i) => `tag${i}`);
    expect(normalizeTags(many)).toHaveLength(MAX_TAGS_PER_ENTRY);
  });

  it("una lista vacía da un array vacío, no undefined", () => {
    expect(normalizeTags([])).toEqual([]);
  });
});
