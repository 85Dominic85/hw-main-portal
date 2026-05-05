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
 * Hero del escudo (decidido 2026-04-30): **delta de SLA en pp** (mejora MoM).
 * En HSM tenemos pain reciente y el SLA absoluto puede ser ~60% — mostrarlo
 * tal cual sería demoledor. Mostrar la TENDENCIA permite validar el esfuerzo
 * cuando el equipo está mejorando, aunque el absoluto siga bajo.
 *
 * Semáforo del delta (en puntos porcentuales):
 *   - `≥ 0pp` → `ok` verde (mejora o plano, ningún empeoramiento).
 *   - `−3pp < d < 0pp` → `warn` ámbar (empeora ligeramente, atención).
 *   - `≤ −3pp` → `danger` rojo (empeora bastante, requiere acción).
 *
 * Updates (decidido 2026-04-30): "Volumen + plazo + tendencia":
 *   L1: `${open} incidencias abiertas · ${rmas} RMAs activas`
 *   L2: `Resolución media: ${avgHours}h`
 *   L3: `↑ +Xpp SLA vs mes pasado` (o `↓ −Xpp`)
 *
 * Estado inicial (endpoint HSM aún no implementado): `getHsmSummary` falla
 * con "Conectando con HSM…" → escudo neutral con mensaje amistoso. La home
 * sigue funcionando. Una vez que HSM publique el endpoint y se setee
 * `HSM_BASE_URL` + `HSM_API_KEY` en Vercel, los datos aparecen automáticamente.
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
  const delta = m.slaDeltaPp;

  // Semáforo del delta — mejora siempre verde, empeoramiento gradúa.
  const heroStatus: ShieldStatus =
    delta >= 0 ? "ok" : delta > -3 ? "warn" : "danger";

  // Display: signo explícito + 1 decimal + sufijo "pp".
  const sign = delta > 0 ? "+" : "";
  const heroDisplay = `${sign}${delta.toFixed(1)}pp`;

  // Línea 1: volumen abiertos + RMAs activas.
  const line1 = {
    title: `${m.current.openIncidents} incidencias abiertas · ${m.current.activeRmas} RMAs activas`,
    description:
      m.current.overdueCount > 0
        ? `${m.current.overdueCount} vencidas ahora · throughput ${m.current.throughputRatio.toFixed(2)}`
        : `Sin vencidas · throughput ${m.current.throughputRatio.toFixed(2)}`,
  };

  // Línea 2: resolución media + reopen rate.
  const avgHours = m.current.avgResolutionHours;
  const line2 = {
    title: avgHours !== null ? `Resolución media: ${avgHours.toFixed(1)}h` : "Sin resueltos en el periodo",
    description:
      avgHours !== null && m.previous.avgResolutionHours !== null
        ? `Mes pasado: ${m.previous.avgResolutionHours.toFixed(1)}h · reapertura ${m.current.reopenRatePct.toFixed(1)}%`
        : `Reapertura ${m.current.reopenRatePct.toFixed(1)}%`,
  };

  // Línea 3: refuerzo de la tendencia (mismo dato del hero pero contextualizado).
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  const line3 = {
    title: `${arrow} ${heroDisplay} SLA vs mes pasado`,
    description: `${m.current.slaCompliancePct.toFixed(1)}% actual · ${m.previous.slaCompliancePct.toFixed(1)}% anterior`,
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
      heroValue={delta}
      heroDisplay={heroDisplay}
      heroStatus={heroStatus}
      updates={updates}
    />
  );
}
