---
name: senior-frontend
description: Patrones de desarrollo frontend moderno aplicables al HW Main Portal — React 19 Server Components, Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui, Tremor. Úsalo cuando diseñes la arquitectura de un componente o decidas entre Server vs Client Component.
---

# Senior Frontend — patrones esenciales

## Server vs Client Components

Default a **Server Component**. Pasa a `"use client"` solo si:
- Hay state (`useState`, `useReducer`).
- Hay efectos (`useEffect`, `useLayoutEffect`).
- Hay event handlers que reciben props no serializables.
- Usa hooks de browser API (window, localStorage).

Patrón: el **layout y la página son Server Components**, los **widgets interactivos son Client Components** dentro. Pasa props serializables (sin funciones).

## Composición sobre props

Mejor:
```tsx
<KpiCard>
  <KpiCard.Title>Pedidos nuevos</KpiCard.Title>
  <KpiCard.Value>47</KpiCard.Value>
  <KpiCard.Trend direction="up">+12% vs ayer</KpiCard.Trend>
</KpiCard>
```

Peor:
```tsx
<KpiCard
  title="Pedidos nuevos"
  value={47}
  trendValue="+12%"
  trendDirection="up"
  trendLabel="vs ayer"
/>
```

Slot pattern escala mejor cuando los KPIs varían.

## Data fetching

- Server Components: fetch directo en el componente con `await`.
- Client Components: TanStack Query con `staleTime: Infinity` (refresh manual).
- API routes: solo cuando el cliente necesita acceso (mutaciones, exports).
- `unstable_cache(fn, key, { revalidate: 60, tags: ['kpi'] })` para datos de conectores.
- `revalidateTag('kpi')` cuando el usuario pulse "Actualizar".

## Estados visuales obligatorios

Toda vista que carga datos: **loading**, **empty**, **error**, **success**. No "se queda en blanco".

```tsx
if (isLoading) return <KpiCardSkeleton />;
if (error) return <KpiCardError onRetry={refetch} />;
if (!data || data.value === null) return <KpiCardEmpty />;
return <KpiCard value={data.value} />;
```

## Performance básico

- `Image` de `next/image` con `width`/`height` o `fill` + `sizes`.
- `dynamic()` para componentes pesados que no se ven inicialmente.
- `Suspense` boundary para cada conector (uno caído no bloquea el resto).
- Evita prop drilling: si tres niveles, pasa a contexto o composition.

## Forms

React Hook Form + Zod resolver. Validador compartido entre cliente y server action.

```tsx
const schema = z.object({ name: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

## Accesibilidad mínima

- Labels asociados a inputs.
- Botones con texto o `aria-label`.
- Foco visible (no `outline: none` sin reemplazar).
- Roles semánticos correctos (no `<div>` clickable, usar `<button>`).
