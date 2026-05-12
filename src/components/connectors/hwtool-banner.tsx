import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { getHwToolSummary, currentMonthPeriod } from "@/server/queries/hwtool";
import { last30DaysFilter } from "@/lib/home/period";
import { getTool } from "@/lib/tools";

interface HwToolBannerProps {
  /** Rango temporal del SELECTOR para los updates. Si no se pasa, mes en curso. */
  from?: Date;
  to?: Date;
}

/**
 * Server Component que fetcha métricas reales del HW Tool y renderiza
 * el bloque ToolSummary.
 *
 * Decisión 2026-05-06: el HERO del escudo usa SIEMPRE últimos 30 días
 * rolling (estable, no sensible al rango pequeño del selector global).
 * Los UPDATES siguen el rango del selector. Si ambos coinciden el cache
 * de 60s sirve un solo hit lógico.
 *
 * Si la API falla o devuelve shape inválido, el escudo aparece en
 * estado "neutral" con un update explicando el motivo. La home no se rompe.
 */
export async function HwToolBanner({ from, to }: HwToolBannerProps = {}) {
  const tool = getTool("hwtool");

  const heroPeriod = last30DaysFilter();
  const updatesPeriod = from || to ? { from, to } : currentMonthPeriod();

  const [heroResult, updatesResult] = await Promise.all([
    getHwToolSummary(heroPeriod),
    getHwToolSummary(updatesPeriod),
  ]);

  const failed = !heroResult.ok ? heroResult : !updatesResult.ok ? updatesResult : null;
  if (failed) {
    const updates: UpdateItem[] = [
      {
        id: "hwtool-error",
        occurredAt: new Date(),
        title: "API Configuraciones no disponible",
        description: failed.error,
      },
    ];
    return (
      <ToolSummary tool={tool} heroValue={null} heroStatus="neutral" updates={updates} />
    );
  }

  const heroData = heroResult.ok ? heroResult.data : null;
  const m = updatesResult.ok ? updatesResult.data : null;
  if (!heroData || !m) return null; // unreachable

  // Semáforo unificado del home (decidido 2026-05-06):
  // ≥75 ok / ≥60 warn / <60 danger. Aplicado al hero (30d fijos).
  const heroStatus: ShieldStatus =
    heroData.successRateFirstTry >= 75
      ? "ok"
      : heroData.successRateFirstTry >= 60
        ? "warn"
        : "danger";

  // Redondeo estándar al entero más cercano para visualización limpia.
  const heroDisplay = `${Math.round(heroData.successRateFirstTry)}%`;

  const equipmentOwnPct = m.equipment.own.percent.toFixed(1);
  const equipmentExternalPct = m.equipment.external.percent.toFixed(1);

  const updates: UpdateItem[] = [
    {
      id: "sessions-summary",
      occurredAt: m.generatedAt,
      title: `${m.principal.totalSessions} sesiones`,
      description: `${m.principal.configuracion} config · ${m.principal.auditoria} auditorías · ${m.principal.noshow} no-show`,
    },
    {
      id: "pnp-delivered",
      occurredAt: m.generatedAt,
      title: `${m.detailed.configPnp.count} PnP entregados`,
      description: `${m.detailed.configPnp.percentOfTotal}% del total · plug-and-play sin 2ª visita`,
    },
    {
      id: "equipment-origin",
      occurredAt: m.generatedAt,
      title: "Origen del equipamiento",
      description: `${equipmentOwnPct}% propio · ${equipmentExternalPct}% externo`,
    },
  ];

  return (
    <ToolSummary
      tool={tool}
      heroValue={heroData.successRateFirstTry}
      heroDisplay={heroDisplay}
      heroStatus={heroStatus}
      updates={updates}
    />
  );
}
