import "server-only";

import { isoWeekToRange, formatWeekKey } from "@/lib/reports/iso-week";
import { reportContentSchemaV1, type ReportContent, type TiptapDoc } from "@/lib/reports/schema";
import rawData from "./example-reports.json";

// ── Shape del JSON de seed (extracción de los PDF) ───────────────────────────

interface ExtractKpiRow {
  label: string; target: string; actual: string; delta: string; status: string; comment: string;
}
interface ExtractAmberRow {
  kpi: string; rootCause: string; action: string; eta: string; escalation: string; status: string;
}
interface ExtractBlocker { description: string; owner: string; impact: string; status: string }
interface ExtractDecision {
  description: string; owner: string; deadline: string; status: string; resolution: string;
}
interface ExtractOrder { venue: string; status: string; notes: string }
interface ExtractCajon { client: string; status: string; provider: string; notes: string }
interface ExtractPerfKpi { label: string; value: string; target: string; status: string }
interface ExtractPerfMember {
  displayName: string; member: string; kpis: ExtractPerfKpi[]; narrative: string[];
}
interface ExtractNextFocus { owner: string; objective: string; output: string; priority: string }
interface ExtractData {
  title: string; author: string; globalStatus: string; publishedAt: string;
  tesis: string[];
  executiveSummary: ExtractKpiRow[];
  amberRed: ExtractAmberRow[];
  highlights: string[];
  blockers: ExtractBlocker[];
  decisions: ExtractDecision[];
  configuraciones: {
    totalConfigs: number | null; successRate1st: number | null; successRate2nd: number | null; problems: string;
  };
  envios: {
    totalOps: number | null; completed: number | null; shipped: number | null; pending: number | null;
    grossRevenue: number | null; avgDeliveryDays: number | null; sla7dPct: number | null;
    marginEur: number | null; coveragePnp: string; officeVsProvider: string; orders: ExtractOrder[];
  };
  soporte: {
    openIncidents: number | null; activeRmas: number | null; sla7dPct: number | null; sla30dPct: number | null;
    reopenRatePct: number | null; avgResolutionHours: number | null; rmaResponseUnder2hPct: number | null;
    narrative: string[];
  };
  cajones: ExtractCajon[];
  performance: ExtractPerfMember[];
  nextFocus: ExtractNextFocus[];
  pabloComments: string[];
}
interface ExtractReport { key: string; isoWeek: number; isoYear: number; data: ExtractData }

const SEED = rawData as unknown as ExtractReport[];

// ── Helpers ──────────────────────────────────────────────────────────────────

const uuid = () => globalThis.crypto.randomUUID();

function doc(paragraphs: string[] | undefined): TiptapDoc {
  return {
    type: "doc",
    content: (paragraphs ?? [])
      .filter((t) => typeof t === "string" && t.trim().length > 0)
      .map((t) => ({ type: "paragraph", content: [{ type: "text", text: t }] })),
  };
}

const MEMBERS: Array<[string, string]> = [
  ["guille", "Guille"],
  ["domi", "Domi"],
  ["marco", "Marco"],
  ["jj", "JJ"],
];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Construye el objeto content y lo valida/normaliza con el schema. */
function buildContent(x: ExtractData): ReportContent {
  const cfg = x.configuraciones ?? {};
  const env = x.envios ?? {};
  const sop = x.soporte ?? {};
  const obj = {
    _version: 1,
    author: x.author ?? "",
    tesis: { doc: doc(x.tesis) },
    executiveSummary: {
      rows: (x.executiveSummary ?? []).map((r) => ({
        id: uuid(), kpiKey: uuid().slice(0, 8), label: r.label ?? "", unit: "",
        target: r.target ?? "", actual: r.actual ?? "", delta: r.delta ?? "",
        source: "manual", status: r.status ?? "neutral", comment: r.comment ?? "",
      })),
    },
    amberRed: {
      rows: (x.amberRed ?? []).map((r) => ({
        id: uuid(), kpi: r.kpi ?? "", rootCause: r.rootCause ?? "", action: r.action ?? "",
        eta: r.eta ?? "", escalation: r.escalation ?? "", status: r.status ?? "amarillo",
      })),
    },
    highlights: { doc: doc(x.highlights) },
    blockers: {
      rows: (x.blockers ?? []).map((r) => ({
        id: uuid(), description: r.description ?? "", owner: r.owner ?? "", impact: r.impact ?? "",
        status: r.status ?? "abierto",
      })),
    },
    decisions: {
      rows: (x.decisions ?? []).map((r) => ({
        id: uuid(), description: r.description ?? "", owner: r.owner ?? "", deadline: r.deadline ?? "",
        status: r.status ?? "pendiente", resolution: r.resolution ?? "",
      })),
    },
    configuraciones: {
      totalConfigs: cfg.totalConfigs ?? null,
      successRate1st: cfg.successRate1st ?? null,
      successRate2nd: cfg.successRate2nd ?? null,
      techBreakdown: [],
      problems: cfg.problems ?? "",
    },
    envios: {
      totalOps: env.totalOps ?? null, completed: env.completed ?? null, shipped: env.shipped ?? null,
      pending: env.pending ?? null, grossRevenue: env.grossRevenue ?? null,
      avgDeliveryDays: env.avgDeliveryDays ?? null, sla7dPct: env.sla7dPct ?? null,
      marginEur: env.marginEur ?? null, coveragePnp: env.coveragePnp ?? "",
      officeVsProvider: env.officeVsProvider ?? "",
      orders: (env.orders ?? []).map((r) => ({
        id: uuid(), venue: r.venue ?? "", status: r.status ?? "pendiente", notes: r.notes ?? "",
      })),
    },
    soporte: {
      openIncidents: sop.openIncidents ?? null, activeRmas: sop.activeRmas ?? null,
      sla7dPct: sop.sla7dPct ?? null, sla30dPct: sop.sla30dPct ?? null,
      reopenRatePct: sop.reopenRatePct ?? null, avgResolutionHours: sop.avgResolutionHours ?? null,
      rmaResponseUnder2hPct: sop.rmaResponseUnder2hPct ?? null,
      rmas: [], narrative: doc(sop.narrative),
    },
    cajones: {
      rows: (x.cajones ?? []).map((r) => ({
        id: uuid(), client: r.client ?? "", status: r.status ?? "", provider: r.provider ?? "",
        notes: r.notes ?? "", mrr: null,
      })),
    },
    performance: {
      members: MEMBERS.map(([member, display]) => {
        const found = (x.performance ?? []).find((p) => p.member === member);
        if (!found) return { member, displayName: display, kpis: [], narrative: { type: "doc", content: [] } };
        return {
          member, displayName: found.displayName || display,
          kpis: (found.kpis ?? []).map((k) => ({
            id: uuid(), label: k.label ?? "", value: k.value ?? "", target: k.target ?? "",
            status: k.status ?? "neutral",
          })),
          narrative: doc(found.narrative),
        };
      }),
    },
    nextFocus: {
      rows: (x.nextFocus ?? []).map((r) => ({
        id: uuid(), owner: r.owner ?? "", objective: r.objective ?? "", output: r.output ?? "",
        priority: r.priority ?? "media",
      })),
    },
    pabloComments: { doc: doc(x.pabloComments) },
  };
  // parse → valida enums/estructura y normaliza; lanza si algo no cuadra.
  return reportContentSchemaV1.parse(obj);
}

export interface SeedReportRow {
  periodKey: string;
  periodFrom: string;
  periodTo: string;
  isoYear: number;
  isoWeek: number;
  title: string;
  globalStatus: string;
  publishedAt: Date;
  content: ReportContent;
}

/** Construye las filas listas para insertar de los informes de ejemplo. */
export function buildExampleReports(): SeedReportRow[] {
  return SEED.map((rep) => {
    const { from, to } = isoWeekToRange(rep.isoYear, rep.isoWeek);
    const publishedAt = rep.data.publishedAt
      ? new Date(`${rep.data.publishedAt}T12:00:00Z`)
      : to;
    return {
      periodKey: formatWeekKey(rep.isoYear, rep.isoWeek),
      periodFrom: ymd(from),
      periodTo: ymd(to),
      isoYear: rep.isoYear,
      isoWeek: rep.isoWeek,
      title: rep.data.title || formatWeekKey(rep.isoYear, rep.isoWeek),
      globalStatus: rep.data.globalStatus,
      publishedAt,
      content: buildContent(rep.data),
    };
  });
}
