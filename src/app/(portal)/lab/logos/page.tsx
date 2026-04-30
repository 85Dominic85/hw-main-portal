import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalLogo, type PortalLogoVariant } from "@/components/brand/portal-logo";

/**
 * Comparador interno de propuestas de logo del portal.
 *
 * 8 variantes mostradas en 3 contextos:
 *   1. Showcase grande (64px) sobre fondo dark + light.
 *   2. Tamaño sidebar expandido (28px) con el texto "Qamarero / HW".
 *   3. Tamaño sidebar colapsado (24px) solo.
 *
 * No aparece en el sidebar — sólo accesible vía URL directa /lab/logos.
 * El usuario revisa visualmente y elige una variante para fijar en producción.
 */

const VARIANTS: { id: PortalLogoVariant; name: string; concept: string }[] = [
  {
    id: "triple-shield",
    name: "Triple escudo",
    concept: "3 escudos apilados con opacidad creciente. Alude a la unificación de las 3 herramientas en una sola vista.",
  },
  {
    id: "shield-hexes",
    name: "Escudo hexagonal",
    concept: "Escudo contenedor + 3 hexágonos modulares dentro. Cada hex = una herramienta. Estética tech.",
  },
  {
    id: "shield-portal",
    name: "Escudo portal",
    concept: "Escudo con un arco de portal/puerta inscrito. La metáfora más literal de portal de entrada al departamento.",
  },
  {
    id: "q-shield",
    name: "Q monograma",
    concept: "Letra Q estilizada (Qamarero) cuya cola actúa como punta inferior del escudo. Más marca corporativa.",
  },
  {
    id: "shield-pillars",
    name: "3 pilares",
    concept: "Escudo con 3 columnas verticales como cariátides. Las 3 herramientas como pilares del depto.",
  },
  {
    id: "convergence",
    name: "Convergencia",
    concept: "3 flechas que convergen al centro del escudo. Señales de las herramientas que se unifican en un punto.",
  },
  {
    id: "hub-shield",
    name: "Hub & escudo",
    concept: "Hub central con 3 nodos satélite dentro del escudo. Topología hub-and-spoke típica de plataformas integradoras.",
  },
  {
    id: "monolith",
    name: "Placa militar",
    concept: "Escudo geométrico estilo placa/dog-tag con bandas horizontales y punto central. Más industrial/severo.",
  },
];

export default function LogosLabPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Lab · Logos del portal</h1>
        <p className="text-sm text-muted-foreground">
          8 propuestas para el logotipo del título. Cada una mostrada a 3 tamaños y sobre fondo claro y oscuro.
          Elige una y la integramos en el sidebar.
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

              {/* Sidebar expandido — al lado del texto */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex h-12 items-center gap-2 rounded-md bg-[#0a0a0b] px-3 text-sm font-mono font-bold text-[#fafafa]">
                  <PortalLogo variant={v.id} size={22} color="#fafafa" />
                  <span>Qamarero / HW</span>
                </div>
                <div className="flex h-12 items-center gap-2 rounded-md bg-[#fafafa] px-3 text-sm font-mono font-bold text-[#0a0a0b]">
                  <PortalLogo variant={v.id} size={22} color="#0a0a0b" />
                  <span>Qamarero / HW</span>
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
