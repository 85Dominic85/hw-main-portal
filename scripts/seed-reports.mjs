/**
 * Seed de informes de ejemplo (W20/W21/W22) en portal.reports.
 *
 * Lee `scripts/seed-reports-data.json` (contenido extraído de los PDF de Notion)
 * y lo inserta como informes PUBLICADOS, con el contenido ya en el shape de
 * reportContentSchemaV1 (texto en target/actual/delta, autor, narrativas como
 * docs Tiptap). Idempotente: borra el informe del mismo period_key antes.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-reports.mjs
 *
 * Requiere PORTAL_DATABASE_URL (el mismo runtime pooler del portal).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DRY = process.env.SEED_DRY === "1";
const url = process.env.PORTAL_DATABASE_URL;
if (!url && !DRY) {
  console.error("✗ Falta PORTAL_DATABASE_URL. Usa: node --env-file=.env.local scripts/seed-reports.mjs");
  process.exit(1);
}

const DATA = JSON.parse(readFileSync(join(__dirname, "seed-reports-data.json"), "utf8"));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Párrafos de texto plano → doc Tiptap. */
function doc(paragraphs) {
  return {
    type: "doc",
    content: (paragraphs || [])
      .filter((t) => typeof t === "string" && t.trim().length > 0)
      .map((t) => ({ type: "paragraph", content: [{ type: "text", text: t }] })),
  };
}

const isoDow = (d) => ((d.getUTCDay() + 6) % 7) + 1;

/** Réplica exacta de src/lib/reports/iso-week.ts → isoWeekToRange. */
function isoWeekToRange(isoYear, isoWeek) {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const mondayOfW1 = new Date(jan4);
  mondayOfW1.setUTCDate(jan4.getUTCDate() - (isoDow(jan4) - 1));
  const from = new Date(mondayOfW1);
  from.setUTCDate(mondayOfW1.getUTCDate() + (isoWeek - 1) * 7);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const MEMBERS = [
  ["guille", "Guille"],
  ["domi", "Domi"],
  ["marco", "Marco"],
  ["jj", "JJ"],
];

/** Convierte el extract simplificado en content del shape reportContentSchemaV1. */
function buildContent(x) {
  const cfg = x.configuraciones || {};
  const env = x.envios || {};
  const sop = x.soporte || {};
  return {
    _version: 1,
    author: x.author || "",
    tesis: { doc: doc(x.tesis) },
    executiveSummary: {
      rows: (x.executiveSummary || []).map((r) => ({
        id: randomUUID(),
        kpiKey: randomUUID().slice(0, 8),
        label: r.label || "",
        unit: "",
        target: r.target || "",
        actual: r.actual || "",
        delta: r.delta || "",
        source: "manual",
        status: r.status || "neutral",
        comment: r.comment || "",
      })),
    },
    amberRed: {
      rows: (x.amberRed || []).map((r) => ({
        id: randomUUID(),
        kpi: r.kpi || "",
        rootCause: r.rootCause || "",
        action: r.action || "",
        eta: r.eta || "",
        escalation: r.escalation || "",
        status: r.status || "amarillo",
      })),
    },
    highlights: { doc: doc(x.highlights) },
    blockers: {
      rows: (x.blockers || []).map((r) => ({
        id: randomUUID(),
        description: r.description || "",
        owner: r.owner || "",
        impact: r.impact || "",
        status: r.status || "abierto",
      })),
    },
    decisions: {
      rows: (x.decisions || []).map((r) => ({
        id: randomUUID(),
        description: r.description || "",
        owner: r.owner || "",
        deadline: r.deadline || "",
        status: r.status || "pendiente",
        resolution: r.resolution || "",
      })),
    },
    configuraciones: {
      totalConfigs: cfg.totalConfigs ?? null,
      successRate1st: cfg.successRate1st ?? null,
      successRate2nd: cfg.successRate2nd ?? null,
      techBreakdown: [],
      problems: cfg.problems || "",
    },
    envios: {
      totalOps: env.totalOps ?? null,
      completed: env.completed ?? null,
      shipped: env.shipped ?? null,
      pending: env.pending ?? null,
      grossRevenue: env.grossRevenue ?? null,
      avgDeliveryDays: env.avgDeliveryDays ?? null,
      sla7dPct: env.sla7dPct ?? null,
      marginEur: env.marginEur ?? null,
      coveragePnp: env.coveragePnp || "",
      officeVsProvider: env.officeVsProvider || "",
      orders: (env.orders || []).map((r) => ({
        id: randomUUID(),
        venue: r.venue || "",
        status: r.status || "pendiente",
        notes: r.notes || "",
      })),
    },
    soporte: {
      openIncidents: sop.openIncidents ?? null,
      activeRmas: sop.activeRmas ?? null,
      sla7dPct: sop.sla7dPct ?? null,
      sla30dPct: sop.sla30dPct ?? null,
      reopenRatePct: sop.reopenRatePct ?? null,
      avgResolutionHours: sop.avgResolutionHours ?? null,
      rmaResponseUnder2hPct: sop.rmaResponseUnder2hPct ?? null,
      rmas: [],
      narrative: doc(sop.narrative),
    },
    cajones: {
      rows: (x.cajones || []).map((r) => ({
        id: randomUUID(),
        client: r.client || "",
        status: r.status || "",
        provider: r.provider || "",
        notes: r.notes || "",
        mrr: null,
      })),
    },
    performance: {
      members: MEMBERS.map(([member, display]) => {
        const found = (x.performance || []).find((p) => p.member === member);
        if (!found) return { member, displayName: display, kpis: [], narrative: { type: "doc", content: [] } };
        return {
          member,
          displayName: found.displayName || display,
          kpis: (found.kpis || []).map((k) => ({
            id: randomUUID(),
            label: k.label || "",
            value: k.value || "",
            target: k.target || "",
            status: k.status || "neutral",
          })),
          narrative: doc(found.narrative),
        };
      }),
    },
    nextFocus: {
      rows: (x.nextFocus || []).map((r) => ({
        id: randomUUID(),
        owner: r.owner || "",
        objective: r.objective || "",
        output: r.output || "",
        priority: r.priority || "media",
      })),
    },
    pabloComments: { doc: doc(x.pabloComments) },
  };
}

// ── Inserción ────────────────────────────────────────────────────────────────

if (DRY) {
  for (const rep of DATA) {
    const c = buildContent(rep.data);
    const counts = {
      execSummary: c.executiveSummary.rows.length,
      amberRed: c.amberRed.rows.length,
      blockers: c.blockers.rows.length,
      decisions: c.decisions.rows.length,
      enviosOrders: c.envios.orders.length,
      cajones: c.cajones.rows.length,
      perfMembers: c.performance.members.filter((m) => m.kpis.length || m.narrative.content.length).length,
      nextFocus: c.nextFocus.rows.length,
      tesisParas: c.tesis.doc.content.length,
      highlightParas: c.highlights.doc.content.length,
    };
    console.log(`[dry] W${rep.isoWeek}-${rep.isoYear} "${rep.data.title}" autor=${c.author}`);
    console.log("      ", JSON.stringify(counts));
  }
  console.log("\nDry run OK (contenido construido, sin tocar la BD).");
  process.exit(0);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  for (const rep of DATA) {
    const { from, to } = isoWeekToRange(rep.isoYear, rep.isoWeek);
    const periodKey = `W${rep.isoWeek}-${rep.isoYear}`;
    const content = buildContent(rep.data);
    const publishedAt = rep.data.publishedAt
      ? new Date(`${rep.data.publishedAt}T12:00:00Z`)
      : to;

    await sql`delete from portal.reports where type = 'weekly' and period_key = ${periodKey}`;
    await sql`
      insert into portal.reports
        (type, period_key, period_from, period_to, iso_year, iso_week,
         status, global_status, title, content, content_version, published_at, created_by)
      values
        ('weekly', ${periodKey}, ${ymd(from)}, ${ymd(to)}, ${rep.isoYear}, ${rep.isoWeek},
         'published', ${rep.data.globalStatus ?? null}, ${rep.data.title || periodKey},
         ${sql.json(content)}, 1, ${publishedAt}, null)
    `;
    console.log(`✓ Sembrado ${periodKey} — ${rep.data.title}`);
  }
  console.log("\nSeed completado. Abre /reports en la app.");
} catch (err) {
  console.error("✗ Error sembrando:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
