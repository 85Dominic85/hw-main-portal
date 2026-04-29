---
description: Explica cómo funciona un archivo, función o módulo del portal en lenguaje claro.
allowed-tools: Read, Glob, Grep
---

# /explain-code

Cuando necesites entender un trozo del código existente, este comando da una explicación estructurada.

## Modos

- `/explain-code <archivo>` — explica el archivo completo.
- `/explain-code <archivo>:<funcion>` — explica una función concreta.
- `/explain-code <feature>` — explica el flujo de una feature (ej. "magic link login").

## Estructura del output

```markdown
## Qué hace
<1-2 frases en lenguaje natural>

## Por qué existe
<el problema que resuelve y por qué se eligió este patrón>

## Inputs
- <param/prop/env var> — tipo, validación, ejemplo

## Outputs / efectos
- <return value, side effects, eventos disparados>

## Dependencias
- <qué importa de dónde, qué módulos clave usa>

## Quién lo llama
- <archivos consumers, con file:line>

## Edge cases / riesgos
- <qué pasa si input vacío, fallo de red, RLS bloquea, etc>

## Cómo probarlo
- <comando o pasos para verificar a mano>
```

## Reglas

- **Lenguaje claro**: si lo entiende un dev junior, está bien.
- **Cita líneas exactas**: `archivo:23-45` para que el lector salte directo.
- **No repitas el código**: explica lo que el código no dice (intención, contexto, alternativas descartadas).
- **Identifica patrones del proyecto**: "esto sigue el patrón de Connector definido en `src/lib/connectors/types.ts`".
- **Marca lo confuso**: si algo te parece poco claro o sospechoso, dilo.

## Cuando NO usar

- Para código que acabas de escribir tú mismo (lo entiendes).
- Para librerías externas (lee la doc oficial).
