import { ToolSummary } from "@/components/kpi/tool-summary";
import type { ShieldStatus } from "@/components/kpi/shield";
import type { UpdateItem } from "@/components/kpi/updates-list";
import { TOOLS } from "@/lib/tools";

/**
 * Home del HW Main Portal — sección Resumen.
 *
 * V0: datos mock. Cuando los conectores estén operativos (Sprint 3, 4),
 * cada herramienta leerá su KPI hero y sus updates desde su connector.
 *
 * El título "Resumen" se renderiza ahora en el Topbar — esta página solo
 * muestra el grid de los 3 ToolSummary.
 */

interface MockSummary {
  hero: number | null;
  status: ShieldStatus;
  updates: UpdateItem[];
}

const MOCK: Record<string, MockSummary> = {
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
      },
    ],
  },
  hwtool: {
    hero: 81,
    status: "warn",
    updates: [
      {
        id: "h1",
        occurredAt: new Date(Date.now() - 1000 * 60 * 18),
        title: "Configuración registrada — TPV Hostería",
        description: "plug-n-play OK · 12 min",
      },
      {
        id: "h2",
        occurredAt: new Date(Date.now() - 1000 * 60 * 90),
        title: "Configuración con incidencia — KDS Cocina",
        description: "Driver impresora térmica",
      },
      {
        id: "h3",
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        title: "5 configs nuevas hoy",
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
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        {TOOLS.map((tool) => {
          const data = MOCK[tool.id]!;
          return (
            <ToolSummary
              key={tool.id}
              tool={tool}
              heroValue={data.hero}
              heroStatus={data.status}
              updates={data.updates}
            />
          );
        })}
      </div>
    </div>
  );
}
