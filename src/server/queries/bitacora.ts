import "server-only";

import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import type { LogEntryRow } from "@/lib/db/schema/log-entries";
import { toDateKey, weekCaptureRange } from "@/lib/bitacora/work-week";
import type { LogEntryFilters } from "@/lib/validators/bitacora";

const { logEntries } = schema;

/**
 * Consultas de la bitácora. Sin `unstable_cache`: `/bitacora` es
 * force-dynamic (se escribe y se lee en la misma sesión, cachear 60s haría
 * que una entrada recién guardada no apareciese).
 */

/** Entradas que cumplen los filtros, más recientes primero. */
export async function listEntries(
  filters: LogEntryFilters = {},
  limit = 200,
): Promise<LogEntryRow[]> {
  const where = [];

  if (filters.from) where.push(gte(logEntries.entryDate, filters.from));
  if (filters.to) where.push(lte(logEntries.entryDate, filters.to));
  if (filters.author) where.push(eq(logEntries.authorEmail, filters.author));
  // `tags` es text[]: el operador @> con un array de un elemento usa el índice GIN.
  if (filters.tag) {
    where.push(sql`${logEntries.tags} @> ARRAY[${filters.tag}]::text[]`);
  }
  // ILIKE sobre body_text, apoyado en el índice trigram. Sin unaccent():
  // el pooler no lo soporta (ver CLAUDE.md).
  if (filters.q) where.push(ilike(logEntries.bodyText, `%${filters.q}%`));

  return db
    .select()
    .from(logEntries)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(logEntries.entryDate), desc(logEntries.createdAt))
    .limit(limit);
}

/**
 * Todas las entradas de una semana ISO, en orden ascendente.
 *
 * Filtra por el rango de CAPTURA (lunes → domingo), no por los 5 días
 * laborables: así una urgencia atendida un sábado entra en la semana y
 * `summarizeWeek` la coloca en `offHours` en lugar de perderse.
 */
export async function getWeekEntries(
  isoYear: number,
  isoWeek: number,
): Promise<LogEntryRow[]> {
  const { from, to } = weekCaptureRange(isoYear, isoWeek);
  return db
    .select()
    .from(logEntries)
    .where(
      and(
        gte(logEntries.entryDate, toDateKey(from)),
        lte(logEntries.entryDate, toDateKey(to)),
      ),
    )
    .orderBy(asc(logEntries.entryDate), asc(logEntries.createdAt));
}

/** Una entrada por id, o null. */
export async function getEntry(id: string): Promise<LogEntryRow | null> {
  const [row] = await db.select().from(logEntries).where(eq(logEntries.id, id)).limit(1);
  return row ?? null;
}

/** Clientes ya usados, para el autocompletado del campo. */
export async function listDistinctClients(limit = 200): Promise<string[]> {
  const rows = await db
    .selectDistinct({ client: logEntries.client })
    .from(logEntries)
    .where(sql`${logEntries.client} is not null and btrim(${logEntries.client}) <> ''`)
    .orderBy(asc(logEntries.client))
    .limit(limit);
  return rows.map((r) => r.client).filter((c): c is string => Boolean(c));
}

/** Autores que han escrito alguna vez, para el filtro. */
export async function listDistinctAuthors(): Promise<
  { email: string; name: string | null }[]
> {
  const rows = await db
    .selectDistinct({
      email: logEntries.authorEmail,
      name: logEntries.authorName,
    })
    .from(logEntries)
    .orderBy(asc(logEntries.authorEmail));

  // Un mismo email puede aparecer con nombres distintos si cambió por el
  // camino (authorName es un snapshot). Se queda el primero no vacío.
  const byEmail = new Map<string, string | null>();
  for (const row of rows) {
    const current = byEmail.get(row.email);
    if (current == null || (!current && row.name)) byEmail.set(row.email, row.name);
  }
  return [...byEmail.entries()].map(([email, name]) => ({ email, name }));
}

/** Etiquetas usadas con su frecuencia, para el filtro. */
export async function listTagCounts(): Promise<{ tag: string; count: number }[]> {
  const rows = await db
    .select({
      tag: sql<string>`t.tag`,
      count: sql<number>`count(*)::int`,
    })
    .from(sql`${logEntries}, unnest(${logEntries.tags}) as t(tag)`)
    .groupBy(sql`t.tag`)
    .orderBy(sql`count(*) desc, t.tag asc`);
  return rows;
}
