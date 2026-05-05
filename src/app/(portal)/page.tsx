import { Suspense } from "react";

import { HwToolBanner } from "@/components/connectors/hwtool-banner";
import { MainOpsBanner } from "@/components/connectors/mainops-banner";
import { HsmBanner } from "@/components/connectors/hsm-banner";
import { ToolBannerSkeleton } from "@/components/connectors/tool-banner-skeleton";
import { HomePeriodSelector } from "@/components/home/period-selector";
import { homePeriodToRange, rangeKey } from "@/lib/home/period";
import { getTool } from "@/lib/tools";

/**
 * Home del HW Main Portal — sección Resumen.
 *
 * - Selector global de periodo arriba (5 presets + custom). Estado en URL.
 * - 3 banners reales con Suspense aislado (si una API cae, las otras
 *   siguen renderizando):
 *     · Logística (MainOps)
 *     · Configuraciones (HW Tool)
 *     · HSM — connector listo, espera endpoint en HSM. Mientras no exista,
 *       muestra escudo neutral con "Conectando con HSM…" sin romper nada.
 *
 * NOTA: el selector de la home NO comparte estado con los selectores
 * propios de `/mainops`, `/hwtool` y `/hsm` por decisión 2026-04-30.
 */

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

        <Suspense
          key={`hsm-${key}`}
          fallback={<ToolBannerSkeleton tool={getTool("hsm")} />}
        >
          <HsmBanner from={range.from} to={range.to} />
        </Suspense>
      </div>
    </div>
  );
}
