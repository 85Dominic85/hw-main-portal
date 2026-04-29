---
description: Scaffolda un conector nuevo para enchufar otra herramienta del dpto al portal.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(npm run lint*), Bash(npm test*)
---

# /add-connector

Crea la estructura completa de un conector nuevo siguiendo el patrón del proyecto.

## Argumentos (vía conversación)

- `name` — slug del conector (`hsm`, `inventario`, ...).
- `display_name` — nombre visible ("Hardware Support Manager").
- `type` — `http` | `supabase-direct` | `internal-actions`.
- `endpoint_or_project` — URL base (http) | project_ref Supabase (supabase-direct).
- `auth` — cómo autenticar (`bearer-token`, `anon-key`, `none`).
- `kpis_iniciales` — lista preliminar de IDs de KPI a soportar.

## Estructura que crea

```
src/lib/connectors/<name>/
├── client.ts           # cliente HTTP / Supabase
├── schema.ts           # Zod del payload externo
├── mapper.ts           # external → portal KPI shape
├── index.ts            # implementación de Connector<T>
├── types.ts            # tipos del conector
└── client.test.ts
```

Más:

```
src/components/connectors/<name>/
├── banner.tsx          # banner en home
└── tab.tsx             # contenido de pestaña
```

Más:

```
src/app/(portal)/<name>/page.tsx     # ruta de la pestaña
src/app/api/connectors/<name>/route.ts (si type=http o internal-actions)
docs/connectors/<name>.md            # contrato y secrets
```

## Pasos del comando

1. **Pregunta los argumentos** que falten.
2. **Verifica que `<name>` no existe** ya en `src/lib/connectors/`.
3. **Crea la estructura** de archivos con stubs que compilan (no funcionalidad real).
4. **Implementa interfaz `Connector<T>`**: `getMetrics(filter)`, `getHotList()`, `healthcheck()`.
5. **Escribe Zod schema** para el payload externo (si `type=http`).
6. **Cliente con manejo de error y timeout** (`AbortSignal.timeout(8000)`).
7. **Cache vía `unstable_cache`** con tag `<name>-metrics`.
8. **Registra en home**: añade el banner a `src/app/(portal)/page.tsx`.
9. **Añade env vars necesarias** a `.env.example`.
10. **Añade MCP server** en `.mcp.json` si aplica (otro Supabase).
11. **Crea documentación** en `docs/connectors/<name>.md`.
12. **Test stub** que verifique que el cliente parsea un payload mock correctamente.
13. **Lint + build**: deben pasar.

## Output

```markdown
Conector `<name>` scaffoldeado.

Archivos creados:
- src/lib/connectors/<name>/{client,schema,mapper,index,types}.ts
- src/lib/connectors/<name>/client.test.ts
- src/components/connectors/<name>/{banner,tab}.tsx
- src/app/(portal)/<name>/page.tsx
- src/app/api/connectors/<name>/route.ts
- docs/connectors/<name>.md

Modificaciones:
- .env.example — añadidas vars <NAME>_API_BASE_URL, <NAME>_API_TOKEN
- .mcp.json — añadido server supabase-<name> (si aplica)
- src/app/(portal)/page.tsx — registrado banner

Pasos manuales pendientes:
- Rellenar las KPIs específicas en `mapper.ts`.
- Configurar las env vars reales en local y Vercel.
- Verificar token con `getMetrics({ period: 'daily' })`.

Lint: ✓
Build: ✓
```
