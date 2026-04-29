import { Suspense } from "react";

import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { HwToolBanner } from "@/components/connectors/hwtool-banner";
import { ToolBannerSkeleton } from "@/components/connectors/tool-banner-skeleton";
import { getTool } from "@/lib/tools";

/**
 * Home del HW Main Portal — sección Resumen.
 *
 * - HW Tool: datos reales vía connector (Suspense individual).
 * - MainOPS y HSM: mock hasta que sus connectors estén implementados.
 *
 * Cada banner está aislado en su propio Suspense boundary: si la API de
 * uno cae, los demás siguen renderizando.
 */

interface MockSummary {
  hero: number | null;
  status: ShieldStatus;
  updates: UpdateItem[];
}

const MOCK: Record<"mainops" | "hsm", MockSummary> = {
  mainops: {
    hero: 94,
    status: "ok",
    updates: [
      {
        id: "m1",
        occurredAt: new Date(Date.now() - 1000 * 60 * 7),
        title: "Pedido MOP-2026-04421 enviado",
        description: "TIPSA · 2 bultos",
      },
      {
        id: "m2",
        occurredAt: new Date(Date.now() - 1000 * 60 * 38),
        title: "Pedido MOP-2026-04420 completado",
      },
      {
        id: "m3",
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        title: "3 pedidos nuevos en cola",
        description: "Connector pendiente — datos mock",
      },
    ],
  },
  hsm: {
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
  },
};

export default function HomePage() {
  const mainops = getTool("mainops");
  const hsm = getTool("hsm");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        <ToolSummary
          tool={mainops}
          heroValue={MOCK.mainops.hero}
          heroStatus={MOCK.mainops.status}
          updates={MOCK.mainops.updates}
        />

        <Suspense fallback={<ToolBannerSkeleton tool={getTool("hwtool")} />}>
          <HwToolBanner />
        </Suspense>

        <ToolSummary
          tool={hsm}
          heroValue={MOCK.hsm.hero}
          heroStatus={MOCK.hsm.status}
          updates={MOCK.hsm.updates}
        />
      </div>
    </div>
  );
}
