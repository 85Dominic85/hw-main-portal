import { Suspense } from "react";

import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { HwToolBanner } from "@/components/connectors/hwtool-banner";
import { MainOpsBanner } from "@/components/connectors/mainops-banner";
import { ToolBannerSkeleton } from "@/components/connectors/tool-banner-skeleton";
import { HomePeriodSelector } from "@/components/home/period-selector";
import { homePeriodToRange, rangeKey } from "@/lib/home/period";
import { getTool } from "@/lib/tools";

/**
 * Home del HW Main Portal — sección Resumen.
 *
 * - Selector global de periodo arriba (5 presets + custom). Estado en URL.
 * - MainOPS / HW Tool: datos reales vía connector con el rango activo
 *   (Suspense aislado, key cambia con el periodo → fuerza re-fetch).
 * - HSM: placeholder hasta que se conecte en v2 (no afectado por el selector).
 *
 * Cada banner está aislado en su propio Suspense boundary: si la API de
 * uno cae, los demás siguen renderizando.
 *
 * NOTA: el selector de la home NO comparte estado con los selectores
 * propios de `/mainops` y `/hwtool` por decisión 2026-04-30.
 */

const HSM_MOCK: { hero: number | null; status: ShieldStatus; updates: UpdateItem[] } = {
  hero: null,
  status: "neutral",
  updates: [
    {
      id: "s1",
      occurredAt: new Date(),
      title: "Conector HSM pendiente para v2",
      description: "Reusará queries existentes de dashboard.ts",
    },
  ],
};

interface HomePageProps {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const range = homePeriodToRange(
    sp.period as Parameters<typeof homePeriodToRange>[0],
    sp.from,
    sp.to,
  );
  const key = rangeKey(range);
  const hsm = getTool("hsm");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground">
            Periodo activo: <span className="font-medium text-foreground">{range.label}</span>
          </p>
        </div>
        <HomePeriodSelector />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        <Suspense
          key={`mainops-${key}`}
          fallback={<ToolBannerSkeleton tool={getTool("mainops")} />}
        >
          <MainOpsBanner from={range.from} to={range.to} />
        </Suspense>

        <Suspense
          key={`hwtool-${key}`}
          fallback={<ToolBannerSkeleton tool={getTool("hwtool")} />}
        >
          <HwToolBanner from={range.from} to={range.to} />
        </Suspense>

        <ToolSummary
          tool={hsm}
          heroValue={HSM_MOCK.hero}
          heroStatus={HSM_MOCK.status}
          updates={HSM_MOCK.updates}
        />
      </div>
    </div>
  );
}
