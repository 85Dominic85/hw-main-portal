import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalLogo, type PortalLogoVariant } from "@/components/brand/portal-logo";

/**
 * Comparador interno de sub-variantes del logo `hub-shield`.
 *
 * Muestra el hub-shield base + 6 matices "bajo asedio" para que el usuario
 * elija cuál transmite mejor "el escudo aguanta golpes constantes".
 *
 * No aparece en sidebar — accesible vía URL directa /lab/logos/hub-shield.
 */

const VARIANTS: { id: PortalLogoVariant; name: string; concept: string }[] = [
  {
    id: "hub-shield",
    name: "Original (control)",
    concept: "Hub central + 3 nodos satélite. Limpio, sin señales de daño. Sirve de baseline para comparar.",
  },
  {
    id: "hub-shield-dent",
    name: "Mellas en el borde",
    concept: "3 pequeños chevrones en el borde superior — cicatrices de impactos previos absorbidos por el blindaje.",
  },
  {
    id: "hub-shield-cracks",
    name: "Grietas radiales",
    concept: "2 grietas finas que irradian desde nodos hacia el borde — el escudo se ha tensionado pero no cedido.",
  },
  {
    id: "hub-shield-pulse",
    name: "Onda de absorción",
    concept: "Anillos concéntricos saliendo del hub — pulsación que sugiere absorción activa de un golpe reciente.",
  },
  {
    id: "hub-shield-impacts",
    name: "Destellos de impacto",
    concept: "Asteriscos sobre 2 nodos — puntos donde el escudo está absorbiendo impactos en tiempo real.",
  },
  {
    id: "hub-shield-shaded",
    name: "Sombreado tensionado",
    concept: "Mitad inferior con relleno denso — el escudo carga con peso, está bajo presión sostenida.",
  },
  {
    id: "hub-shield-battle",
    name: "Combinación sutil",
    concept: "Sombra inferior + 1 grieta + 1 mella superior. Lectura compuesta: cicatrices + tensión + impactos pasados. Recomendada si quieres riqueza sin saturar.",
  },
];

export default function HubShieldLabPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Lab · Hub-shield bajo asedio</h1>
        <p className="text-sm text-muted-foreground">
          7 variantes del logo elegido (hub-shield) con distintas señales de
          &quot;el escudo aguanta golpes&quot;. Cada una se muestra a 3 tamaños sobre dark + light.
          Elige la que mejor transmita la idea sin perder legibilidad a 22px.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {VARIANTS.map((v) => (
          <Card key={v.id}>
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm uppercase tracking-wider">
                {v.id}
              </CardTitle>
              <CardDescription className="text-xs">{v.name} — {v.concept}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Showcase grande sobre dark y light */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex h-28 items-center justify-center rounded-md bg-[#0a0a0b]">
                  <PortalLogo variant={v.id} size={64} color="#fafafa" />
                </div>
                <div className="flex h-28 items-center justify-center rounded-md bg-[#fafafa]">
                  <PortalLogo variant={v.id} size={64} color="#0a0a0b" />
                </div>
              </div>

              {/* Sidebar expandido — al lado del texto nuevo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex h-12 items-center gap-2 rounded-md bg-[#0a0a0b] px-3 text-sm font-mono font-bold text-[#fafafa]">
                  <PortalLogo variant={v.id} size={22} color="#fafafa" />
                  <span>Hardware Dashboard</span>
                </div>
                <div className="flex h-12 items-center gap-2 rounded-md bg-[#fafafa] px-3 text-sm font-mono font-bold text-[#0a0a0b]">
                  <PortalLogo variant={v.id} size={22} color="#0a0a0b" />
                  <span>Hardware Dashboard</span>
                </div>
              </div>

              {/* Sidebar colapsado — solo logo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#0a0a0b]">
                  <PortalLogo variant={v.id} size={22} color="#fafafa" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#fafafa]">
                  <PortalLogo variant={v.id} size={22} color="#0a0a0b" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
