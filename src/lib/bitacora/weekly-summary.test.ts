import { describe, it, expect } from "vitest";

import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import { authorDisplayName, summarizeWeek } from "./weekly-summary";

// W36-2026 = lunes 31 ago → viernes 4 sep (sáb 5 y dom 6 son fin de semana).
const YEAR = 2026;
const WEEK = 36;

const MON = "2026-08-31";
const TUE = "2026-09-01";
const WED = "2026-09-02";
const THU = "2026-09-03";
const FRI = "2026-09-04";
const SAT = "2026-09-05";

let seq = 0;

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
    body: { type: "doc", content: [] },
    bodyText: "",
    tags: [],
    client: null,
    status: null,
    highlight: false,
    isoYear: YEAR,
    isoWeek: WEEK,
    isoDow: ((d.getUTCDay() + 6) % 7) + 1,
    createdAt: new Date(`${entryDate}T09:00:0${seq % 10}Z`),
    updatedAt: new Date(`${entryDate}T09:00:00Z`),
    ...over,
  } as LogEntryRow;
}

describe("summarizeWeek — semana vacía", () => {
  const s = summarizeWeek([], YEAR, WEEK);

  it("no revienta y da totales a cero", () => {
    expect(s.totals.entries).toBe(0);
    expect(s.totals.perWorkDay).toBe(0);
    expect(s.totals.clients).toBe(0);
    expect(s.totals.authors).toEqual([]);
  });

  it("aún así devuelve los 5 tramos de días laborables", () => {
    expect(s.byWorkDay).toHaveLength(5);
    expect(s.byWorkDay.every((d) => d.entries.length === 0)).toBe(true);
  });

  it("el pico es 0, no undefined (la gráfica necesita un número)", () => {
    expect(s.peakDayEntries).toBe(0);
  });

  it("la etiqueta cierra en viernes", () => {
    expect(s.label).toContain("4 sept");
  });
});

describe("summarizeWeek — días laborables", () => {
  it("agrupa por día y mantiene 5 tramos con los huecos a cero", () => {
    const s = summarizeWeek(
      [entry({ entryDate: MON }), entry({ entryDate: MON }), entry({ entryDate: THU })],
      YEAR,
      WEEK,
    );
    expect(s.byWorkDay.map((d) => d.entries.length)).toEqual([2, 0, 0, 1, 0]);
    expect(s.byWorkDay.map((d) => d.label)).toEqual([
      "LUN",
      "MAR",
      "MIÉ",
      "JUE",
      "VIE",
    ]);
  });

  it("el pico refleja el día más cargado", () => {
    const s = summarizeWeek(
      [entry({ entryDate: FRI }), entry({ entryDate: FRI }), entry({ entryDate: MON })],
      YEAR,
      WEEK,
    );
    expect(s.peakDayEntries).toBe(2);
  });
});

describe("summarizeWeek — la media divide entre 5, no entre 7", () => {
  it("14 entradas laborables dan 2,8 al día", () => {
    const days = [MON, MON, MON, TUE, TUE, WED, WED, THU, THU, THU, FRI, FRI, FRI, FRI];
    const s = summarizeWeek(
      days.map((d) => entry({ entryDate: d })),
      YEAR,
      WEEK,
    );
    expect(s.totals.entries).toBe(14);
    // El bug obvio (dividir entre 7) daría 2.
    expect(s.totals.perWorkDay).toBe(2.8);
    expect(s.totals.perWorkDay).not.toBe(2);
  });

  it("5 entradas en 5 días dan exactamente 1", () => {
    const s = summarizeWeek(
      [MON, TUE, WED, THU, FRI].map((d) => entry({ entryDate: d })),
      YEAR,
      WEEK,
    );
    expect(s.totals.perWorkDay).toBe(1);
  });
});

describe("summarizeWeek — fin de semana", () => {
  const s = summarizeWeek(
    [entry({ entryDate: MON }), entry({ entryDate: SAT, title: "Urgencia sábado" })],
    YEAR,
    WEEK,
  );

  it("la entrada de sábado NO se pierde: cuenta en el total", () => {
    expect(s.totals.entries).toBe(2);
  });

  it("sale en offHours, no en la gráfica de 5 días", () => {
    expect(s.offHours).toHaveLength(1);
    expect(s.offHours[0]?.title).toBe("Urgencia sábado");
    expect(s.byWorkDay.reduce((n, d) => n + d.entries.length, 0)).toBe(1);
  });

  it("no infla la media por día laborable", () => {
    // 1 entrada laborable / 5 días = 0,2. Si contara el sábado daría 0,4.
    expect(s.totals.perWorkDay).toBe(0.2);
  });

  it("sigue apareciendo en el cronológico", () => {
    expect(s.chronological).toHaveLength(2);
  });
});

describe("summarizeWeek — etiquetas", () => {
  const s = summarizeWeek(
    [
      entry({ tags: ["incidencia", "cajones"] }),
      entry({ tags: ["incidencia"] }),
      entry({ tags: ["instalacion"] }),
      entry({ tags: [] }),
      entry({ tags: [] }),
    ],
    YEAR,
    WEEK,
  );

  it("ordena el ranking por frecuencia descendente", () => {
    expect(s.tagRanking).toEqual([
      { tag: "incidencia", count: 2 },
      { tag: "cajones", count: 1 },
      { tag: "instalacion", count: 1 },
    ]);
  });

  it("una entrada con 2 etiquetas cuenta en los dos grupos", () => {
    const incidencia = s.byTag.find((g) => g.key === "incidencia");
    const cajones = s.byTag.find((g) => g.key === "cajones");
    expect(incidencia?.entries).toHaveLength(2);
    expect(cajones?.entries).toHaveLength(1);
    // Por eso la suma del ranking excede el total de entradas.
    const sumTags = s.tagRanking.reduce((n, t) => n + t.count, 0);
    expect(sumTags).toBeGreaterThan(s.totals.entries - s.untagged.length);
  });

  it("las entradas sin etiqueta van a untagged, no a un grupo vacío", () => {
    expect(s.untagged).toHaveLength(2);
    expect(s.byTag.some((g) => g.key === "")).toBe(false);
  });
});

describe("summarizeWeek — autores", () => {
  const s = summarizeWeek(
    [
      entry({ authorEmail: "domingo.bueno@qamarero.com", authorName: "Domingo" }),
      entry({ authorEmail: "domingo.bueno@qamarero.com", authorName: "Domingo" }),
      entry({ authorEmail: "marco@qamarero.com", authorName: "Marco" }),
      entry({ authorEmail: "guillermo.mateos@qamarero.com", authorName: null }),
    ],
    YEAR,
    WEEK,
  );

  it("ordena por número de entradas, descendente", () => {
    expect(s.totals.authors[0]).toMatchObject({ name: "Domingo", entries: 2 });
    expect(s.totals.authors).toHaveLength(3);
  });

  it("los totales por autor suman el total de la semana", () => {
    const sum = s.totals.authors.reduce((n, a) => n + a.entries, 0);
    expect(sum).toBe(s.totals.entries);
  });

  it("byAuthor está alineado con los totales", () => {
    expect(s.byAuthor.map((g) => g.entries.length)).toEqual(
      s.totals.authors.map((a) => a.entries),
    );
  });
});

describe("summarizeWeek — status y highlight (lo que no se puede calcular del texto)", () => {
  const s = summarizeWeek(
    [
      entry({ status: "abierta", title: "Cajón El Puerto" }),
      entry({ status: "resuelta" }),
      entry({ status: "resuelta" }),
      entry({ status: "seguimiento" }),
      entry({ status: null, highlight: true, title: "Subida 6% proveedor" }),
      entry({ status: null }),
    ],
    YEAR,
    WEEK,
  );

  it("cuenta las incidencias por estado", () => {
    expect(s.totals.incidents).toEqual({
      total: 4,
      abiertas: 1,
      resueltas: 2,
      seguimiento: 1,
    });
  });

  it("una entrada sin estado no se cuenta como incidencia", () => {
    // 6 entradas, solo 4 con estado.
    expect(s.totals.entries).toBe(6);
    expect(s.totals.incidents.total).toBe(4);
  });

  it("openItems recoge solo las abiertas", () => {
    expect(s.openItems).toHaveLength(1);
    expect(s.openItems[0]?.title).toBe("Cajón El Puerto");
  });

  it("highlights recoge solo las marcadas, sin importar su estado", () => {
    expect(s.highlights).toHaveLength(1);
    expect(s.highlights[0]?.title).toBe("Subida 6% proveedor");
  });
});

describe("summarizeWeek — clientes", () => {
  it("cuenta distintos, ignora vacíos y ordena alfabéticamente", () => {
    const s = summarizeWeek(
      [
        entry({ client: "Restaurante El Puerto" }),
        entry({ client: "Bar Manolo" }),
        entry({ client: "Bar Manolo" }),
        entry({ client: "   " }),
        entry({ client: null }),
      ],
      YEAR,
      WEEK,
    );
    expect(s.totals.clients).toBe(2);
    expect(s.clients).toEqual(["Bar Manolo", "Restaurante El Puerto"]);
  });
});

describe("summarizeWeek — orden cronológico", () => {
  it("ordena por fecha ascendente", () => {
    const s = summarizeWeek(
      [entry({ entryDate: FRI }), entry({ entryDate: MON }), entry({ entryDate: WED })],
      YEAR,
      WEEK,
    );
    expect(s.chronological.map((e) => e.entryDate)).toEqual([MON, WED, FRI]);
  });

  it("no muta el array de entrada", () => {
    const input = [entry({ entryDate: FRI }), entry({ entryDate: MON })];
    const before = input.map((e) => e.entryDate);
    summarizeWeek(input, YEAR, WEEK);
    expect(input.map((e) => e.entryDate)).toEqual(before);
  });
});

describe("authorDisplayName", () => {
  it("usa el nombre cuando existe", () => {
    expect(
      authorDisplayName({ authorEmail: "x@qamarero.com", authorName: "Domingo" }),
    ).toBe("Domingo");
  });

  it("cae a la parte local del email cuando no hay nombre", () => {
    expect(
      authorDisplayName({ authorEmail: "guillermo.mateos@qamarero.com", authorName: null }),
    ).toBe("guillermo.mateos");
  });

  it("un nombre en blanco cuenta como ausente", () => {
    expect(
      authorDisplayName({ authorEmail: "marco@qamarero.com", authorName: "   " }),
    ).toBe("marco");
  });
});
