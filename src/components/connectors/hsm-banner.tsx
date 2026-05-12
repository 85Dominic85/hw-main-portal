import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { getHsmSummary, currentMonthPeriod } from "@/server/queries/hsm";
import { last30DaysFilter } from "@/lib/home/period";
import { getTool } from "@/lib/tools";

interface HsmBannerProps {
  /** Rango temporal del SELECTOR para los updates. Si no se pasa, mes en curso. */
  from?: Date;
  to?: Date;
}

/**
 * Server Component que fetcha métricas reales de HSM y renderiza el bloque
 * `<ToolSummary>` con el escudo, updates y atajo a HSM.
 *
 * Decisión 2026-05-06 (v0.6): el HERO del escudo usa SIEMPRE últimos 30
 * días rolling — no es sensible al selector global porque la salud del SLA
 * del depto se mide en ciclos largos. Los UPDATES bajo el escudo SÍ siguen
 * el rango del selector, así el user puede explorar sub-periodos sin
 * desestabilizar el hero. Si ambos rangos coinciden, el cache de 60s sirve
 * un solo hit lógico.
 *
 * Hero del escudo: **% SLA cumplido** absoluto en los últimos 30d.
 *   - Si en 30d hay resueltas: heroData.current.slaCompliancePct.
 *   - Si NO hay resueltas en 30d (caso raro): hero neutral con `—`.
 *
 * Semáforo del % SLA (calibrado para HSM con pain reciente — más laxo que
 * MainOps porque el equipo está en remontada):
 *   - `≥ 90%` → `ok` verde · `≥ 75%` → `warn` ámbar · `< 75%` → `danger` rojo.
 *
 * Updates (basados en el periodo del selector):
 *   L1: `${open} incidencias abiertas · ${rmas} RMAs activas` (snapshot real).
 *   L2: `Resolución media: ${avgHours}h` o "Sin resueltos en el periodo".
 *   L3: tendencia MoM (delta SLA del periodo del selector vs su anterior).
 *
 * Estado inicial (endpoint HSM aún no implementado o env vars vacías):
 * escudo neutral con "Conectando con HSM…" — la home no se rompe.
 */
export async function HsmBanner({ from, to }: HsmBannerProps = {}) {
  const tool = getTool("hsm");

  const heroPeriod = last30DaysFilter();
  const updatesPeriod = from || to ? { from, to } : currentMonthPeriod();

  const [heroResult, updatesResult] = await Promise.all([
    getHsmSummary(heroPeriod),
    getHsmSummary(updatesPeriod),
  ]);

  // Si cualquier fetch falla → mostrar error "Conectando con HSM…" o el
  // mensaje de la API (priorizamos el del hero porque es la métrica visible).
  const failed = !heroResult.ok ? heroResult : !updatesResult.ok ? updatesResult : null;
  if (failed) {
    const isUnconfigured = failed.error.startsWith("Conectando con HSM");
    const updates: UpdateItem[] = [
      {
        id: "hsm-error",
        occurredAt: new Date(),
        title: isUnconfigured ? "Conectando con HSM…" : "API HSM no disponible",
        description: isUnconfigured
          ? "Esperando endpoint y env vars en Vercel."
          : failed.error,
      },
    ];
    return (
      <ToolSummary tool={tool} heroValue={null} heroStatus="neutral" updates={updates} />
    );
  }

  const heroData = heroResult.ok ? heroResult.data : null;
  const m = updatesResult.ok ? updatesResult.data : null;
  if (!heroData || !m) return null; // unreachable

  const c = m.current; // periodo del selector
  const p = m.previous;
  const heroCurrent = heroData.current; // últimos 30d

  // --- Hero del escudo ------------------------------------------------------
  // Validar que los 30d tienen resueltas — sin resueltas, slaCompliancePct
  // viene a 100% por default y mentiría. Caso raro pero posible (depto
  // recién arrancado, vacaciones, etc.).
  const heroHasResolved = heroCurrent.avgResolutionHours !== null;

  let heroValue: number | null = null;
  let heroDisplay: string | undefined;
  let heroStatus: ShieldStatus = "neutral";

  if (heroHasResolved) {
    heroValue = heroCurrent.slaCompliancePct;
    // Redondeo hacia arriba para visualización limpia (83.0 → 83, 77.4 → 78).
    heroDisplay = `${Math.ceil(heroValue)}%`;
    // Semáforo unificado del home (decidido 2026-05-06):
    // ≥75 ok / ≥60 warn / <60 danger.
    heroStatus = heroValue >= 75 ? "ok" : heroValue >= 60 ? "warn" : "danger";
  }

  // --- Updates (rango selector) --------------------------------------------
  const periodHasResolved = c.avgResolutionHours !== null;
  const periodHasActivity =
    c.openIncidents > 0 ||
    c.activeRmas > 0 ||
    c.incidentsByPriority.some((b) => b.count > 0) ||
    periodHasResolved;

  if (!periodHasActivity || !periodHasResolved) {
    // Periodo del selector vacío → updates honestos sobre el snapshot global
    // y el contexto del periodo anterior. El hero ya tiene su valor (de 30d).
    const trend = formatTrend(m.slaDeltaPp);
    const updates: UpdateItem[] = [
      {
        id: "no-activity",
        occurredAt: m.generatedAt,
        title: "Sin actividad en el periodo seleccionado",
        description: periodHasActivity
          ? "Hay incidencias en curso pero ninguna resuelta todavía."
          : "Aún no hay incidencias ni RMAs en el rango seleccionado.",
      },
      {
        id: "previous-context",
        occurredAt: m.generatedAt,
        title: `Periodo anterior: ${p.slaCompliancePct.toFixed(1)}% SLA`,
        description:
          p.avgResolutionHours !== null
            ? `${p.avgResolutionHours.toFixed(1)}h resolución · reapertura ${p.reopenRatePct.toFixed(1)}%`
            : `Reapertura ${p.reopenRatePct.toFixed(1)}%`,
      },
      {
        id: "open-snapshot",
        occurredAt: m.generatedAt,
        title: `${c.openIncidents} incidencias abiertas · ${c.activeRmas} RMAs activas`,
        description: trend ? `Tendencia: ${trend}` : "Snapshot actual del depto",
      },
    ];
    return (
      <ToolSummary
        tool={tool}
        heroValue={heroValue}
        heroDisplay={heroDisplay}
        heroStatus={heroStatus}
        updates={updates}
      />
    );
  }

  // Periodo del selector con datos reales.
  const line1 = {
    title: `${c.openIncidents} incidencias abiertas · ${c.activeRmas} RMAs activas`,
    description:
      c.overdueCount > 0
        ? `${c.overdueCount} vencidas ahora · throughput ${c.throughputRatio.toFixed(2)}`
        : `Sin vencidas · throughput ${c.throughputRatio.toFixed(2)}`,
  };

  const line2 = {
    title: `Resolución media: ${c.avgResolutionHours!.toFixed(1)}h`,
    description:
      p.avgResolutionHours !== null
        ? `Anterior: ${p.avgResolutionHours.toFixed(1)}h · reapertura ${c.reopenRatePct.toFixed(1)}%`
        : `Reapertura ${c.reopenRatePct.toFixed(1)}%`,
  };

  const trend = formatTrend(m.slaDeltaPp);
  const line3 = {
    title: trend
      ? `${trend} SLA vs periodo anterior`
      : `${c.slaCompliancePct.toFixed(1)}% SLA vs ${p.slaCompliancePct.toFixed(1)}%`,
    description: `${c.slaCompliancePct.toFixed(1)}% actual · ${p.slaCompliancePct.toFixed(1)}% anterior`,
  };

  const updates: UpdateItem[] = [
    {
      id: "volume",
      occurredAt: m.generatedAt,
      title: line1.title,
      description: line1.description,
    },
    {
      id: "resolution",
      occurredAt: m.generatedAt,
      title: line2.title,
      description: line2.description,
    },
    {
      id: "trend",
      occurredAt: m.generatedAt,
      title: line3.title,
      description: line3.description,
    },
  ];

  return (
    <ToolSummary
      tool={tool}
      heroValue={heroValue}
      heroDisplay={heroDisplay}
      heroStatus={heroStatus}
      updates={updates}
    />
  );
}

/** Formatea el delta MoM en pp con flecha. Devuelve null si delta = 0 exacto. */
function formatTrend(deltaPp: number): string | null {
  if (deltaPp === 0) return null;
  const sign = deltaPp > 0 ? "+" : "";
  const arrow = deltaPp > 0 ? "↑" : "↓";
  return `${arrow} ${sign}${deltaPp.toFixed(1)}pp`;
}
