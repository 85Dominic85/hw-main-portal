import { Shield, type ShieldStatus, type ShieldVariant } from "@/components/kpi/shield";

/**
 * Comparador interno de variantes del componente <Shield>.
 *
 * Grid 6 (variantes) × 4 (estados ok / warn / danger / neutral) con
 * porcentajes representativos. Permite al usuario elegir cuál variante
 * fija en producción antes de seguir con conectores reales.
 *
 * No aparece en el sidebar — sólo accesible vía URL directa /lab/shields.
 */

const VARIANTS: { id: ShieldVariant; name: string; description: string }[] = [
  {
    id: "heater",
    name: "Heater clásico",
    description: "Blasón medieval reconocible. Top recto + costados curvos + V suave.",
  },
  {
    id: "rivets",
    name: "Heater con remaches",
    description: "Heater + 6 remaches en el borde tintados con el status. Más defensivo.",
  },
  {
    id: "kite",
    name: "Kite elongado",
    description: "Escudo de torneo esbelto. Costados cóncavos, punta más larga.",
  },
  {
    id: "hex",
    name: "Hexagonal tech",
    description: "Geometría nítida con refuerzos paralelos. Más moderno/digital.",
  },
  {
    id: "double",
    name: "Doble blindaje",
    description: "Heater con escudo interno concéntrico. Sensación de armadura en capas.",
  },
  {
    id: "modern",
    name: "Modern badge",
    description: "Octagonal con esquinas biseladas + bandas tipo placa militar / dog-tag.",
  },
  {
    id: "rivets-double",
    name: "Heater con remaches + doble blindaje",
    description:
      "Combina las dos: remaches semáforo en el borde + escudo interno concéntrico. Máximo carácter defensivo manteniendo silueta clásica.",
  },
];

const STATES: { id: ShieldStatus; label: string; value: number | null }[] = [
  { id: "ok", label: "ok", value: 96 },
  { id: "warn", label: "warn", value: 78 },
  { id: "danger", label: "danger", value: 42 },
  { id: "neutral", label: "neutral", value: null },
];

export default function ShieldsLabPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Lab · Shields</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Comparador de las 6 variantes del componente <code className="font-mono">{"<Shield>"}</code>.
          Cada fila es una variante; cada columna un estado del semáforo. Una vez decidamos cuál,
          se fija como default en <code className="font-mono">tool-summary.tsx</code>.
        </p>
      </header>

      <div className="space-y-12">
        {VARIANTS.map((variant) => (
          <section key={variant.id} className="space-y-4">
            <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {variant.name}{" "}
                  <code className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    variant=&quot;{variant.id}&quot;
                  </code>
                </h2>
                <p className="text-sm text-muted-foreground">{variant.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATES.map((state) => (
                <div
                  key={state.id}
                  className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/40 bg-card/30 p-6"
                >
                  <Shield
                    value={state.value}
                    label={`% ejemplo (${state.label})`}
                    status={state.id}
                    variant={variant.id}
                    size={180}
                  />
                  <code className="text-xs text-muted-foreground">status={state.label}</code>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-border/60 pt-6 text-sm text-muted-foreground">
        <p>
          ¿Cuál te convence? Una vez decidamos, en{" "}
          <code className="font-mono">src/components/kpi/tool-summary.tsx</code> cambiamos
          <code className="ml-1 font-mono">shieldVariant=&quot;heater&quot;</code> por la elegida —
          el resto del layout no cambia (todas usan el mismo viewBox).
        </p>
      </footer>
    </div>
  );
}
