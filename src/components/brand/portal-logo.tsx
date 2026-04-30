"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type PortalLogoVariant =
  | "triple-shield"
  | "shield-hexes"
  | "shield-portal"
  | "q-shield"
  | "shield-pillars"
  | "convergence"
  | "hub-shield"
  | "hub-shield-dent"
  | "hub-shield-cracks"
  | "hub-shield-pulse"
  | "hub-shield-impacts"
  | "hub-shield-shaded"
  | "hub-shield-battle"
  | "monolith";

export interface PortalLogoProps {
  variant: PortalLogoVariant;
  /** Tamaño en px (cuadrado). Default 28. */
  size?: number;
  /** Color principal (stroke/fill). Default `currentColor` para heredar text-foreground. */
  color?: string;
  className?: string;
}

/**
 * Catálogo de propuestas de logo para el portal.
 *
 * Concepto: cada variante intenta representar `portal + escudo + unificar`
 * (3 herramientas → 1 vista, defensa/control, capa única).
 *
 * Diseñado para verse nítido a 24-28px (tamaño sidebar) y a 64px (showcase).
 * Stroke base 1.5px sobre viewBox 24x24 — Tailwind escala bien.
 */
export function PortalLogo({
  variant,
  size = 28,
  color = "currentColor",
  className,
}: PortalLogoProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    className: cn("inline-block shrink-0", className),
  };

  switch (variant) {
    case "triple-shield":
      // 3 escudos apilados en abanico que convergen — alude a unificación.
      return (
        <svg {...props}>
          <path
            d="M5 6c0-.6.4-1 1-1l4-1 4 1c.6 0 1 .4 1 1v6c0 3-2.5 5-5 6-2.5-1-5-3-5-6V6z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
            opacity="0.4"
          />
          <path
            d="M7 5.5c0-.5.4-1 1-1l4-1 4 1c.6 0 1 .5 1 1V12c0 3-2.5 5-5 6-2.5-1-5-3-5-6V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
            opacity="0.7"
          />
          <path
            d="M9 5c0-.6.4-1 1-1l4-1 4 1c.6 0 1 .4 1 1v6c0 3-2.5 5.3-5 6.5-2.5-1.2-5-3.5-5-6.5V5z"
            fill={color}
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
            fillOpacity="0.08"
          />
        </svg>
      );

    case "shield-hexes":
      // Escudo formado por 3 hexágonos modulares — cada hex = una herramienta.
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M9 7.5l1.5 1v2L9 11.5 7.5 10.5v-2L9 7.5z"
            fill={color}
            opacity="0.85"
          />
          <path
            d="M15 7.5l1.5 1v2l-1.5 1L13.5 10.5v-2L15 7.5z"
            fill={color}
            opacity="0.85"
          />
          <path
            d="M12 12.5l1.5 1v2l-1.5 1L10.5 15.5v-2l1.5-1z"
            fill={color}
            opacity="0.85"
          />
        </svg>
      );

    case "shield-portal":
      // Escudo con arco de portal/puerta inscrito — "portal de entrada".
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 16V11.5a3.5 3.5 0 017 0V16"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="11"
            x2="12"
            y2="16"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );

    case "q-shield":
      // Monograma Q (Qamarero) con forma de escudo. Cola de la Q como punta.
      return (
        <svg {...props}>
          <circle
            cx="12"
            cy="11"
            r="6.5"
            stroke={color}
            strokeWidth="1.5"
          />
          <path
            d="M14.5 13.5L18 17"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="11" r="2.5" fill={color} opacity="0.85" />
        </svg>
      );

    case "shield-pillars":
      // Escudo con 3 pilares verticales — las 3 herramientas como columnas.
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <rect x="7.5" y="8" width="2" height="7" rx="0.4" fill={color} opacity="0.85" />
          <rect x="11" y="8" width="2" height="7" rx="0.4" fill={color} opacity="0.85" />
          <rect x="14.5" y="8" width="2" height="7" rx="0.4" fill={color} opacity="0.85" />
        </svg>
      );

    case "convergence":
      // 3 flechas convergiendo al centro de un escudo — unificar señales.
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M7 9l4 3M17 9l-4 3M12 16v-4"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.3" fill={color} />
        </svg>
      );

    case "hub-shield":
      // Escudo con hub central + 3 nodos satélite.
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
        </svg>
      );

    case "hub-shield-dent":
      // hub-shield + 3 mellas en el borde superior (zona de impactos recibidos).
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
          {/* Mellas en el borde superior — pequeños chevrones hacia abajo */}
          <path
            d="M13.4 3.6l0.5 0.7l0.5 -0.7"
            stroke={color}
            strokeWidth="0.7"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M15.6 4l0.5 0.7l0.5 -0.7"
            stroke={color}
            strokeWidth="0.7"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M17.2 4.6l0.4 0.6l0.4 -0.6"
            stroke={color}
            strokeWidth="0.7"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </svg>
      );

    case "hub-shield-cracks":
      // hub-shield + 2 grietas finas radiando de los nodos hacia el borde.
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
          {/* Grieta saliendo del nodo top-right hacia el borde superior derecho */}
          <path
            d="M16.6 7.6l0.7 -1.1l-0.3 -0.7l0.9 -1.3"
            stroke={color}
            strokeWidth="0.6"
            fill="none"
            opacity="0.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Grieta saliendo del nodo bottom hacia abajo a la izquierda */}
          <path
            d="M11.4 16.7l-0.5 0.6l0.3 0.6l-0.6 0.7"
            stroke={color}
            strokeWidth="0.6"
            fill="none"
            opacity="0.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "hub-shield-pulse":
      // hub-shield + onda concéntrica saliendo del hub (absorción de impacto).
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Anillos concéntricos saliendo del hub */}
          <circle
            cx="12"
            cy="11.5"
            r="3.4"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
            opacity="0.35"
            strokeDasharray="0.6 0.7"
          />
          <circle
            cx="12"
            cy="11.5"
            r="4.8"
            stroke={color}
            strokeWidth="0.4"
            fill="none"
            opacity="0.18"
            strokeDasharray="0.4 0.9"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
        </svg>
      );

    case "hub-shield-impacts":
      // hub-shield + asteriscos de destello sobre 2 nodos (puntos de impacto activos).
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
          {/* Destello sobre nodo top-right */}
          <g stroke={color} strokeWidth="0.55" strokeLinecap="round" opacity="0.7">
            <line x1="16" y1="6.5" x2="16" y2="7.2" />
            <line x1="14.5" y1="8.5" x2="14.9" y2="8.5" />
            <line x1="17.1" y1="8.5" x2="17.5" y2="8.5" />
            <line x1="14.8" y1="7.3" x2="15.1" y2="7.6" />
            <line x1="17.2" y1="7.3" x2="16.9" y2="7.6" />
          </g>
          {/* Destello sobre nodo bottom */}
          <g stroke={color} strokeWidth="0.55" strokeLinecap="round" opacity="0.7">
            <line x1="12" y1="14" x2="12" y2="14.7" />
            <line x1="10.5" y1="16" x2="10.9" y2="16" />
            <line x1="13.1" y1="16" x2="13.5" y2="16" />
          </g>
        </svg>
      );

    case "hub-shield-shaded":
      // hub-shield + sombreado pronunciado en mitad inferior (peso bajo presión).
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Mitad inferior con sombreado denso */}
          <path
            d="M4.2 11.5c0.5 0 7.8 -0.4 7.8 -0.4s7.3 0.4 7.8 0.4V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9v-0.5z"
            fill={color}
            fillOpacity="0.18"
            stroke="none"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
        </svg>
      );

    case "hub-shield-battle":
      // hub-shield + combinación sutil: sombra inferior + grieta + mella superior.
      return (
        <svg {...props}>
          <path
            d="M4 5.5c0-.4.3-.8.7-.9L12 3l7.3 1.6c.4.1.7.5.7.9V12c0 4-3.5 7-8 9-4.5-2-8-5-8-9V5.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Sombreado inferior suave */}
          <path
            d="M4.2 12.5c0 0 7.8 -0.2 7.8 -0.2s7.3 0.2 7.8 0.2c0 4-3.5 6.7-8 8.5-4.5-1.8-8-4.5-8-8.5z"
            fill={color}
            fillOpacity="0.13"
            stroke="none"
          />
          <line x1="12" y1="11.5" x2="8" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="16" y2="8.5" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <line x1="12" y1="11.5" x2="12" y2="16" stroke={color} strokeWidth="1.1" opacity="0.6" />
          <circle cx="8" cy="8.5" r="1.4" fill={color} />
          <circle cx="16" cy="8.5" r="1.4" fill={color} />
          <circle cx="12" cy="16" r="1.4" fill={color} />
          <circle cx="12" cy="11.5" r="1.7" fill={color} />
          {/* Grieta sutil top-right */}
          <path
            d="M16.5 7.5l0.6 -0.9l-0.2 -0.7l0.8 -1.2"
            stroke={color}
            strokeWidth="0.55"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Mella en borde superior */}
          <path
            d="M14.6 3.7l0.5 0.7l0.5 -0.7"
            stroke={color}
            strokeWidth="0.7"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </svg>
      );

    case "monolith":
      // Escudo abstracto + bandas geométricas (estilo dog-tag/placa militar moderna).
      return (
        <svg {...props}>
          <path
            d="M5 4.5c0-.3.2-.5.5-.5h13c.3 0 .5.2.5.5v9.5c0 4-3 6.5-7 8-4-1.5-7-4-7-8V4.5z"
            stroke={color}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <line x1="5" y1="9" x2="19" y2="9" stroke={color} strokeWidth="1.1" opacity="0.55" />
          <line x1="5" y1="13" x2="19" y2="13" stroke={color} strokeWidth="1.1" opacity="0.55" />
          <circle cx="12" cy="11" r="1.6" fill={color} />
        </svg>
      );

    default:
      return null;
  }
}
