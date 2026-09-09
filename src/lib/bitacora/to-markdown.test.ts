import { describe, it, expect } from "vitest";

import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import type { TiptapDoc } from "@/lib/reports/schema";
import { summarizeWeek } from "./weekly-summary";
import { entryHeading, summaryToMarkdown, summaryToNotionMarkdown } from "./to-markdown";

const YEAR = 2026;
const WEEK = 36;
const MON = "2026-08-31";
const SAT = "2026-09-05";

let seq = 0;

function bodyDoc(...paragraphs: string[]): TiptapDoc {
  return {
    type: "doc",
    content: paragraphs.map((t) => ({
      type: "paragraph",
      content: [{ type: "text", text: t }],
    })),
  } as TiptapDoc;
}

function entry(over: Partial<LogEntryRow> = {}): LogEntryRow {
  seq += 1;
  const entryDate = (over.entryDate as string | undefined) ?? MON;
  const d = new Date(`${entryDate}T00:00:00Z`);
  return {
    id: `id-${seq}`,
    entryDate,
    authorEmail: "domingo.bueno@qamarero.com",
    authorName: "Domingo",
    title: null,
    body: bodyDoc("Texto de la entrada."),
    bodyText: "Texto de la entrada.",
    tags: [],
    client: null,
    status: null,
    highlight: false,
    isoYear: YEAR,
    isoWeek: WEEK,
    isoDow: ((d.getUTCDay() + 6) % 7) + 1,
    createdAt: new Date(`${entryDate}T09:00:00Z`),
    updatedAt: new Date(`${entryDate}T09:00:00Z`),
    ...over,
  } as LogEntryRow;
}

const md = (entries: LogEntryRow[]) =>
  summaryToMarkdown(summarizeWeek(entries, YEAR, WEEK));

describe("summaryToMarkdown — estructura", () => {
  it("abre con el título de la semana, cerrando en viernes", () => {
    const out = md([entry()]);
    expect(out.startsWith("# Bitácora · Semana 36")).toBe(true);
    expect(out).toContain("4 sept");
  });

  it("pone el scorecard ANTES del diario", () => {
    const out = md([entry()]);
    expect(out.indexOf("## Resumen de la semana")).toBeLessThan(
      out.indexOf("## Diario de la semana"),
    );
  });

  it("dice 'entradas registradas', no 'trabajos'", () => {
    // La cifra mide registro, no rendimiento — y la va a leer jota.
    expect(md([entry(), entry()])).toContain("**2 entradas registradas**");
  });

  it("una semana vacía sale con su aviso y sin reventar", () => {
    const out = md([]);
    expect(out).toContain("_No se registró ninguna entrada esta semana._");
    expect(out).toContain("**0 entradas registradas**");
  });

  it("no deja tres saltos de línea seguidos", () => {
    expect(md([entry(), entry({ highlight: true })])).not.toMatch(/\n{3}/);
  });

  it("termina con un único salto de línea", () => {
    const out = md([entry()]);
    expect(out.endsWith("\n")).toBe(true);
    expect(out.endsWith("\n\n")).toBe(false);
  });
});

describe("summaryToMarkdown — contenido de las entradas", () => {
  it("incluye el cuerpo serializado desde TipTap", () => {
    const out = md([
      entry({ body: bodyDoc("Cambiado el cable RJ11."), bodyText: "Cambiado el cable RJ11." }),
    ]);
    expect(out).toContain("Cambiado el cable RJ11.");
  });

  it("mantiene el formato markdown de las marcas", () => {
    const out = md([
      entry({
        title: "Con negrita",
        body: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "El " },
                { type: "text", text: "cable", marks: [{ type: "bold" }] },
                { type: "text", text: " estaba pinzado." },
              ],
            },
          ],
        } as TiptapDoc,
      }),
    ]);
    expect(out).toContain("**cable**");
  });

  it("saca autor, cliente, etiquetas y estado en la línea de metadatos", () => {
    const out = md([
      entry({
        title: "Cajón no abre",
        client: "Restaurante El Puerto",
        tags: ["incidencia", "cajones"],
        status: "abierta",
      }),
    ]);
    expect(out).toContain("Domingo");
    expect(out).toContain("Restaurante El Puerto");
    expect(out).toContain("`incidencia`");
    expect(out).toContain("**Abierta**");
  });
});

describe("summaryToMarkdown — bloques calculados", () => {
  it("saca 'Lo que hay que mirar' solo si hay entradas destacadas", () => {
    expect(md([entry()])).not.toContain("## Lo que hay que mirar");
    expect(md([entry({ highlight: true, title: "Subida 6%" })])).toContain(
      "## Lo que hay que mirar",
    );
  });

  it("saca 'Sigue abierto' con las abiertas que no estén ya destacadas", () => {
    const out = md([entry({ status: "abierta", title: "Cajón" })]);
    expect(out).toContain("## Sigue abierto");
    expect(out).toContain("Cajón");
  });

  it("no repite una entrada en 'Sigue abierto' si ya está en destacados", () => {
    const out = md([entry({ status: "abierta", highlight: true, title: "Cajón" })]);
    expect(out).toContain("## Lo que hay que mirar");
    expect(out).not.toContain("## Sigue abierto");
  });

  it("resume las incidencias por estado", () => {
    const out = md([
      entry({ status: "abierta" }),
      entry({ status: "resuelta" }),
      entry({ status: "resuelta" }),
    ]);
    expect(out).toContain("2 resueltas");
    expect(out).toContain("1 abiertas");
  });

  it("lista la actividad de los 5 días laborables", () => {
    const out = md([entry({ entryDate: MON })]);
    expect(out).toMatch(/LUN 1 · MAR 0 · MIÉ 0 · JUE 0 · VIE 0/);
  });
});

describe("summaryToMarkdown — fin de semana", () => {
  const out = md([entry({ entryDate: MON }), entry({ entryDate: SAT, title: "Urgencia" })]);

  it("avisa en el scorecard de lo registrado en fin de semana", () => {
    expect(out).toContain("**Fuera de horario**: 1 entrada en fin de semana");
  });

  it("y lo incluye en el diario, en su propia sección", () => {
    expect(out).toContain("### Fuera de horario");
    expect(out).toContain("Urgencia");
  });
});

describe("summaryToNotionMarkdown", () => {
  it("mete un divisor antes de cada sección de nivel 2", () => {
    const out = summaryToNotionMarkdown(summarizeWeek([entry()], YEAR, WEEK));
    expect(out).toContain("---\n\n## Resumen de la semana");
    expect(out).toContain("---\n\n## Diario de la semana");
  });

  it("no toca los encabezados de nivel 3", () => {
    const out = summaryToNotionMarkdown(summarizeWeek([entry()], YEAR, WEEK));
    expect(out).not.toMatch(/---\n\n### /);
  });

  it("conserva el mismo contenido que la variante normal", () => {
    const summary = summarizeWeek([entry({ title: "Algo" })], YEAR, WEEK);
    const plain = summaryToMarkdown(summary);
    const notion = summaryToNotionMarkdown(summary);
    expect(notion.replace(/\n\n---\n\n/g, "\n")).toContain("Algo");
    expect(notion.length).toBeGreaterThan(plain.length);
  });
});

describe("entryHeading", () => {
  it("usa el título cuando existe", () => {
    expect(entryHeading(entry({ title: "Cajón no abre" }))).toBe("Cajón no abre");
  });

  it("cae a la primera línea del cuerpo si no hay título", () => {
    expect(entryHeading(entry({ body: bodyDoc("Primera línea.", "Segunda.") }))).toBe(
      "Primera línea.",
    );
  });

  it("sin título ni cuerpo devuelve un marcador legible", () => {
    expect(entryHeading(entry({ title: null, body: bodyDoc() }))).toBe("(sin título)");
  });
});
