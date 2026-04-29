---
name: react-best-practices
description: Reglas de performance y diseño de componentes en React 19 + Next.js 15. Úsalo para optimizar rendering, evitar re-renders innecesarios, gestionar bundle size y patrones de composición.
---

# React Best Practices — checklist aplicado al portal

## Re-renders y memoización

- **Memoiza valores derivados pesados** con `useMemo` solo si:
  - El cálculo es realmente costoso (>1ms).
  - Su resultado se pasa a un componente memoizado o a `useEffect`.
- **`React.memo`** solo en componentes que:
  - Reciben props estables.
  - Renderizan algo costoso.
  - Aparecen en listas largas.
- No memoices todo "por si acaso" — más overhead que beneficio.

## Keys en listas

Usar IDs estables (`row.id`), no índices. Índice solo cuando el orden es inmutable y no hay add/remove.

## Estado: levantar lo justo, derivar lo demás

- Si un valor se puede derivar de otro estado o props → no lo guardes, derívalo.
- Sube el state al ancestro común mínimo.
- `useState` para local; `useReducer` para state complejo con transiciones; contexto solo para state global de verdad (auth, theme).

## Server Components vs Client

Reglas:
- Componente que solo renderiza datos → Server.
- Componente que reacciona a input del usuario → Client.
- Mezcla: Server pasa data a Client wrapper.

Anti-patrón: convertir un layout entero a Client porque un botón necesita state. Encapsula el botón.

## Suspense y loading

- Cada conector con `<Suspense fallback={<Skeleton />}>`. Si MainOPS tarda, HW Tool no espera.
- Streaming SSR (`loading.tsx`) para UX rápida.

## Bundle size

- `import dynamic from "next/dynamic"` para componentes pesados (gráficas grandes, editores).
- Tree-shake imports: `import { Card } from "@tremor/react"` (no `import * as Tremor`).
- Iconos: `import { ChevronDown } from "lucide-react"` — Lucide ya es tree-shakeable.

## Forms

React Hook Form > controlled state manual. Sin re-renders por cada keystroke.

## URL state

`nuqs` para filtros, paginación, sorting, tabs. Mantiene shareable y back/forward funciona.

## Accesibilidad de patrones comunes

- Modal: foco trap, ESC cierra, scroll lock.
- Combobox: ARIA roles correctos (cmdk + shadcn lo cubre).
- Tooltip: con delay >300ms, no en mobile.
- Tablas grandes: header sticky, paginación clara.

## Cosas que evitar

- Spread props sin saber qué lleva (`<div {...props} />` opaco).
- `dangerouslySetInnerHTML` salvo casos justificados.
- Callbacks anónimos en JSX cuando se pasan a componentes memoizados.
- `useEffect` para sincronizar estado con props (es señal de que el state no debería existir).
