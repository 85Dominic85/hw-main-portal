import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { getHsmSummary, currentMonthPeriod } from "@/server/queries/hsm";
import { getTool } from "@/lib/tools";

interface HsmBannerProps {
  /** Rango temporal a consultar. Si no se pasa, usa el mes en curso. */
  from?: Date;
  to?: Date;
}

/**
 * Server Component que fetcha métricas reales de HSM y renderiza el bloque
 * `<ToolSummary>` con el escudo, updates y atajo a HSM.
 *
 * Hero del escudo (decidido 2026-05-06): **% SLA cumplido absoluto**.
 *   - Cambio respecto a v0.4: el delta MoM (`+5.2pp`) era engañoso cuando
 *     el periodo no tenía actividad — `slaCompliancePct` cae en 100% por
 *     default cuando no hay resueltos, así que ambos periodos salían al
 *     100% y el delta = 0.0pp verde, simulando "todo perfecto".
 *   - Ahora mostramos el cumplimiento absoluto del periodo. Cuando no hay
 *     actividad real, el escudo va a neutral con `—` para no mentir.
 *
 * Detección "sin actividad":
 *   - Si `avgResolutionHours === null` y `incidentsByPriority` está vacío,
 *     el `slaCompliancePct === 100` viene del default de HSM (no hay
 *     resueltos en el periodo) — no es información útil. Mostrar neutral.
 *
 * Semáforo del % SLA (calibrado para HSM con pain reciente — más laxo
 * que MainOps porque el equipo está en remontada):
 *   - `≥ 90%` → `ok` verde (excelente).
 *   - `≥ 75%` → `warn` ámbar (mejorable, dentro de aceptable).
 *   - `< 75%` → `danger` rojo (acción requerida).
 *
 * Updates (recortados al estado real, sin cifras engañosas en periodos
 * vacíos):
 *   L1: `${open} incidencias abiertas · ${rmas} RMAs activas`
 *        descripción: vencidas + throughput (si hay actividad).
 *   L2: `Resolución media: ${avgHours}h` (o "Sin resueltos en el periodo").
 *   L3: tendencia MoM como dato secundario (`↑ +5pp vs mes pasado`).
 *
 * Estado inicial (endpoint HSM aún no implementado o env vars vacías):
 * escudo neutral con "Conectando con HSM…" — la home no se rompe.
 */
export async function HsmBanner({ from, to }: HsmBannerProps = {}) {
  const tool = getTool("hsm");
  const period = from || to ? { from, to } : currentMonthPeriod();
  const result = await getHsmSummary(period);

  if (!result.ok) {
    const isUnconfigured = result.error.startsWith("Conectando con HSM");
    const updates: UpdateItem[] = [
      {
        id: "hsm-error",
        occurredAt: new Date(),
        title: isUnconfigured ? "Conectando con HSM…" : "API HSM no disponible",
        description: isUnconfigured
          ? "Esperando endpoint y env vars en Vercel."
          : result.error,
      },
    ];
    return (
      <ToolSummary tool={tool} heroValue={null} heroStatus="neutral" updates={updates} />
    );
  }

  const m = result.data;
  const c = m.current;
  const p = m.previous;

  // --- Detección de "sin actividad" en el periodo actual ----------------
  // El default de HSM `slaCompliancePercent = 100` cuando no hay resueltos
  // hace que el hero parezca perfecto sin serlo. Detectamos esto y caemos
  // al estado neutral con `—` y un update explicando el motivo.
  const hasResolved = c.avgResolutionHours !== null;
  const hasIncidents =
    c.openIncidents > 0 ||
    c.incidentsByPriority.some((b) => b.count > 0) ||
    hasResolved;
  const hasActivity = hasIncidents || c.activeRmas > 0;

  if (!hasActivity || !hasResolved) {
    // Sin datos suficientes: hero neutral, updates honestos.
    const trend = formatTrend(m.slaDeltaPp);
    const updates: UpdateItem[] = [
      {
        id: "no-activity",
        occurredAt: m.generatedAt,
        title: "Sin actividad en el periodo",
        description: hasActivity
          ? "Hay incidencias en curso pero ninguna resuelta todavía."
          : "Aún no hay incidencias ni RMAs en el rango seleccionado.",
      },
      {
        id: "previous-context",
        occurredAt: m.generatedAt,
        title: `Mes pasado: ${p.slaCompliancePct.toFixed(1)}% SLA`,
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
        heroValue={null}
        heroStatus="neutral"
        updates={updates}
      />
    );
  }

  // --- Caso normal con datos --------------------------------------------
  const slaPct = c.slaCompliancePct;

  // Semáforo SLA absoluto. Calibrado para HSM (≥90 / ≥75 / <75) — más laxo
  // que MainOps porque el equipo está en remontada y se busca premiar
  // mejoras sin demoler con umbrales corporativos.
  const heroStatus: ShieldStatus =
    slaPct >= 90 ? "ok" : slaPct >= 75 ? "warn" : "danger";

  const heroDisplay = `${slaPct.toFixed(1)}%`;

  // Línea 1: volumen abiertos + RMAs activas.
  const line1 = {
    title: `${c.openIncidents} incidencias abiertas · ${c.activeRmas} RMAs activas`,
    description:
      c.overdueCount > 0
        ? `${c.overdueCount} vencidas ahora · throughput ${c.throughputRatio.toFixed(2)}`
        : `Sin vencidas · throughput ${c.throughputRatio.toFixed(2)}`,
  };

  // Línea 2: resolución media + reopen rate (solo si hay datos).
  const line2 = {
    title: `Resolución media: ${c.avgResolutionHours!.toFixed(1)}h`,
    description:
      p.avgResolutionHours !== null
        ? `Mes pasado: ${p.avgResolutionHours.toFixed(1)}h · reapertura ${c.reopenRatePct.toFixed(1)}%`
        : `Reapertura ${c.reopenRatePct.toFixed(1)}%`,
  };

  // Línea 3: tendencia MoM como dato secundario (ahora que el hero es
  // absoluto, el delta queda como contexto útil pero no mete ruido).
  const trend = formatTrend(m.slaDeltaPp);
  const line3 = {
    title: trend
      ? `${trend} SLA vs mes pasado`
      : `${slaPct.toFixed(1)}% SLA vs ${p.slaCompliancePct.toFixed(1)}%`,
    description: `${slaPct.toFixed(1)}% actual · ${p.slaCompliancePct.toFixed(1)}% anterior`,
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
      heroValue={slaPct}
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
