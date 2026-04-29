import { Suspense } from "react";

import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { HwToolBanner } from "@/components/connectors/hwtool-banner";
import { MainOpsBanner } from "@/components/connectors/mainops-banner";
import { ToolBannerSkeleton } from "@/components/connectors/tool-banner-skeleton";
import { getTool } from "@/lib/tools";

/**
 * Home del HW Main Portal — sección Resumen.
 *
 * - MainOPS: datos reales vía connector (Suspense aislado).
 * - HW Tool: datos reales vía connector (Suspense aislado).
 * - HSM: placeholder hasta que se conecte en v2.
 *
 * Cada banner está aislado en su propio Suspense boundary: si la API de
 * uno cae, los demás siguen renderizando.
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

export default function HomePage() {
  const hsm = getTool("hsm");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        <Suspense fallback={<ToolBannerSkeleton tool={getTool("mainops")} />}>
          <MainOpsBanner />
        </Suspense>

        <Suspense fallback={<ToolBannerSkeleton tool={getTool("hwtool")} />}>
          <HwToolBanner />
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
