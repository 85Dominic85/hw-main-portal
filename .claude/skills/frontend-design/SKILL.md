---
name: frontend-design
description: Diseñar dashboards production-grade con shadcn/ui + Tremor + Tailwind v4. Úsalo cuando crees una nueva pestaña, una visualización compleja, o un layout que tenga que sentir "polish".
---

# Frontend Design — para dashboards del portal

## Filosofía

El portal es una herramienta de management. **Velocidad de comprensión > belleza decorativa**. Cada pixel justifica su existencia.

## Layout base

- **Sidebar izq**: navegación entre pestañas. Ancho 240px desplegado, 64px colapsado.
- **Header top**: título de pestaña + filtros temporales + botón "Actualizar" + avatar usuario.
- **Main**: 12-col grid con `gap-6`. Bloques pueden ocupar 4/8/12 cols.
- **Footer**: minimal — versión, último refresh, link a status page.

## Jerarquía de información

1. **KPI hero**: 1-2 números grandes (text-4xl, font-bold, números tabulares).
2. **KPIs secundarios**: row de 3-4 cards más pequeñas (text-2xl).
3. **Gráficas**: 1-2 cards anchas con title + chart + legend.
4. **Tablas/Hot list**: bloque inferior, scroll interno si hay >10 rows.
5. **Notas/contexto**: aparte, no compite con datos.

## Color

Paleta neutra (slate/zinc) + 3 acentos:
- **Verde** (`emerald-600` / `emerald-400`): bueno / positivo / dentro de meta.
- **Ámbar** (`amber-500`): atención / casi rojo.
- **Rojo** (`rose-600`): malo / fuera de meta.

Color **nunca decorativo**, siempre semántico. Si una cifra no tiene umbral, no le pongas color.

## Tipografía

- **Inter** o **Geist Sans** (Google Fonts).
- **JetBrains Mono** o **Geist Mono** para números tabulares.
- Tamaños: `text-xs` (labels), `text-sm` (body), `text-base` (default), `text-2xl` (KPI secundario), `text-4xl` (KPI hero).
- `tabular-nums` siempre en valores numéricos para que no "salten".

## Espaciado

- Sistema: múltiplos de 4 (Tailwind default).
- Padding interno cards: `p-4` denso o `p-6` cómodo. Mantén consistencia.
- Gap entre bloques: `gap-4` denso o `gap-6` cómodo.
- Sin paddings asimétricos sin razón.

## Microinteracciones

- Hover en cards interactivas: `transition-colors` con `hover:bg-muted/50`.
- Loading: skeletons que respeten el shape final (no spinners genéricos).
- Mutaciones: toast con `sonner`, max 4s.
- Transiciones: `duration-150` o `duration-200`. Más de 300ms ya es lento.

## Modo oscuro/claro

- Implementar **ambos** desde el día uno via `next-themes` + clases Tailwind `dark:`.
- Default: oscuro (mejor para horas de oficina con pantallas grandes).
- Toggle accesible en el header.

## Componentes específicos del portal

- **KpiCard**: title (text-sm muted) + value (text-4xl tabular) + delta (text-sm con icono ↑↓ + color semáforo) + sparkline opcional.
- **Banner**: card grande con icono de la herramienta, KPI hero, 2-3 KPIs secundarios, botón "Ver detalle" + "Abrir herramienta" externo.
- **DateRangePicker**: presets (Hoy / 7d / 30d / 90d / Mes actual / Custom) con shadcn Popover + Calendar.
- **ExportButton**: dropdown con "CSV", "CSV con filtros aplicados", "Copy link".
- **HotListItem**: row con timestamp relativo, severidad, descripción, botón "Ver".

## Anti-patrones

- Gradientes "decorativos" en cards.
- Animaciones que tardan >300ms.
- Charts 3D, donuts decorativos, glow effects.
- Sombras pesadas (preferir border subtle).
- Iconos > texto cuando texto cabe.
