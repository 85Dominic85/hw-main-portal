import { describe, it, expect } from "vitest";

import type { TiptapDoc } from "@/lib/reports/schema";
import { firstLine, isEmptyDoc, tiptapToPlainText } from "./body-text";

const doc = (content: unknown[]): TiptapDoc =>
  ({ type: "doc", content }) as TiptapDoc;

const p = (...text: string[]) => ({
  type: "paragraph",
  content: text.map((t) => ({ type: "text", text: t })),
});

describe("tiptapToPlainText", () => {
  it("un doc vacío da cadena vacía", () => {
    expect(tiptapToPlainText(doc([]))).toBe("");
    expect(tiptapToPlainText(null)).toBe("");
    expect(tiptapToPlainText(undefined)).toBe("");
  });

  it("extrae un párrafo simple", () => {
    expect(tiptapToPlainText(doc([p("Cajón no abre al cerrar mesa.")]))).toBe(
      "Cajón no abre al cerrar mesa.",
    );
  });

  it("separa párrafos con salto de línea, sin pegar palabras", () => {
    const out = tiptapToPlainText(doc([p("Primero."), p("Segundo.")]));
    expect(out).toBe("Primero.\nSegundo.");
    expect(out).not.toContain("Primero.Segundo.");
  });

  it("concatena los text nodes de un mismo párrafo", () => {
    // Así es como TipTap parte un párrafo con negrita en medio.
    const out = tiptapToPlainText(doc([p("El cable ", "RJ11", " estaba pinzado.")]));
    expect(out).toBe("El cable RJ11 estaba pinzado.");
  });

  it("conserva el texto de las marcas (negrita, cursiva, enlace)", () => {
    const out = tiptapToPlainText(
      doc([
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Ver ", marks: [] },
            {
              type: "text",
              text: "el ticket",
              marks: [{ type: "link", attrs: { href: "https://x.test" } }],
            },
          ],
        },
      ]),
    );
    expect(out).toBe("Ver el ticket");
    expect(out).not.toContain("https://");
  });

  it("aplana listas con un elemento por línea", () => {
    const out = tiptapToPlainText(
      doc([
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [p("Dos KDS en cocina")] },
            { type: "listItem", content: [p("Uno en el pase")] },
          ],
        },
      ]),
    );
    expect(out.split("\n")).toEqual(["Dos KDS en cocina", "Uno en el pase"]);
  });

  it("incluye los headings", () => {
    const out = tiptapToPlainText(
      doc([
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Resumen" }] },
        p("Todo bien."),
      ]),
    );
    expect(out).toBe("Resumen\nTodo bien.");
  });

  it("normaliza espacios en blanco redundantes", () => {
    expect(tiptapToPlainText(doc([p("  hola    mundo  ")]))).toBe("hola mundo");
  });

  it("no revienta con un nodo de tipo desconocido", () => {
    const out = tiptapToPlainText(
      doc([{ type: "algoRaro", content: [{ type: "text", text: "sigue" }] }]),
    );
    expect(out).toBe("sigue");
  });
});

describe("firstLine", () => {
  it("devuelve la primera línea con contenido", () => {
    expect(firstLine(doc([p("Primero."), p("Segundo.")]))).toBe("Primero.");
  });

  it("trunca con puntos suspensivos si excede el máximo", () => {
    const out = firstLine(doc([p("a".repeat(200))]), 20);
    expect(out).toHaveLength(20);
    expect(out.endsWith("…")).toBe(true);
  });

  it("no trunca si cabe justo", () => {
    expect(firstLine(doc([p("hola")]), 10)).toBe("hola");
  });

  it("doc vacío da cadena vacía", () => {
    expect(firstLine(doc([]))).toBe("");
  });
});

describe("isEmptyDoc", () => {
  it("detecta el doc vacío que produce TipTap al abrir el editor", () => {
    // TipTap crea un párrafo vacío, no un content: [].
    expect(isEmptyDoc(doc([{ type: "paragraph" }]))).toBe(true);
    expect(isEmptyDoc(doc([]))).toBe(true);
    expect(isEmptyDoc(doc([p("  ")]))).toBe(true);
  });

  it("un doc con texto no está vacío", () => {
    expect(isEmptyDoc(doc([p("algo")]))).toBe(false);
  });
});
