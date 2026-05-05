import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { getHwToolSummary, currentMonthPeriod } from "@/server/queries/hwtool";
import { getTool } from "@/lib/tools";

interface HwToolBannerProps {
  /** Rango temporal a consultar. Si no se pasa, usa el mes en curso (compat retro). */
  from?: Date;
  to?: Date;
}

/**
 * Server Component que fetcha métricas reales del HW Tool y renderiza
 * el bloque ToolSummary (escudo + atajo + nombre + updates).
 *
 * Si la API falla o devuelve shape inválido, el escudo aparece en
 * estado "neutral" con un update explicando el motivo. La home no se rompe.
 */
export async function HwToolBanner({ from, to }: HwToolBannerProps = {}) {
  const tool = getTool("hwtool");
  const period = from || to ? { from, to } : currentMonthPeriod();
  const result = await getHwToolSummary(period);

  if (!result.ok) {
    const updates: UpdateItem[] = [
      {
        id: "hwtool-error",
        occurredAt: new Date(),
        title: "API Configuraciones no disponible",
        description: result.error,
      },
    ];
    return (
      <ToolSummary tool={tool} heroValue={null} heroStatus="neutral" updates={updates} />
    );
  }

  const m = result.data;

  // Semáforo: ≥80 ok / ≥60 warn / <60 danger.
  const heroStatus: ShieldStatus =
    m.successRateFirstTry >= 80
      ? "ok"
      : m.successRateFirstTry >= 60
        ? "warn"
        : "danger";

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
      heroValue={m.successRateFirstTry}
      heroStatus={heroStatus}
      updates={updates}
    />
  );
}
