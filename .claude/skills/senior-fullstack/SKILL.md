---
name: senior-fullstack
description: Patrones para implementar features end-to-end en el portal — desde schema Drizzle hasta componente UI. Úsalo cuando una feature toque DB + server action + UI a la vez.
---

# Senior Fullstack — patrones end-to-end

## Flujo canónico de una feature

1. Schema Drizzle (`src/lib/db/schema/<tabla>.ts`).
2. Migración (`npm run db:generate` + revisión + `db:push` en dev).
3. Validador Zod (`src/lib/validators/<tabla>.ts`) compartido cliente/server.
4. Server query o action (`src/server/{queries,actions}/`).
5. API route si el cliente necesita acceso directo (`src/app/api/...`).
6. Hook TanStack Query (`src/hooks/use-<tabla>.ts`).
7. Componente UI (`src/components/<dominio>/`).
8. Página que lo orquesta (`src/app/(portal)/<ruta>/page.tsx`).
9. Tests (vitest junto al archivo).

## Server Actions

Convención del proyecto:

```ts
"use server";

import { schema } from "@/lib/validators/foo";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export async function createFoo(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "UNAUTHORIZED" };
  if (session.user.role !== "admin") return { ok: false, error: "FORBIDDEN" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() };

  const row = await db.insert(foos).values(parsed.data).returning();
  revalidateTag("foos");
  return { ok: true, data: row[0] };
}
```

- Siempre tipo de retorno `Result = { ok: true, data } | { ok: false, error }`.
- Auth + role check **antes** de validar input.
- Revalidate tags afectadas tras mutación.

## TanStack Query mutations

```ts
const mutation = useMutation({
  mutationFn: (input) => createFooAction(input),
  onSuccess: (result) => {
    if (result.ok) {
      toast.success("Creado");
      queryClient.invalidateQueries({ queryKey: ["foos"] });
    } else {
      toast.error("Error: " + result.error);
    }
  },
});
```

## Conectores

Patrón estándar (`src/lib/connectors/<name>/`):

```
mainops/
  ├── client.ts        # fetch HTTP / cliente Supabase
  ├── schema.ts        # Zod del payload externo
  ├── mapper.ts        # external shape → portal KPI shape
  ├── index.ts         # interfaz Connector<MainOpsMetrics>
  └── client.test.ts
```

## Reglas no negociables

- TS strict, sin `any`.
- Server-only modules nunca importados desde Client Components.
- Secrets solo `process.env.X` (sin `NEXT_PUBLIC_`).
- RLS revisada cada vez que se añade tabla.
- Tests al menos para connectors y server actions.
