import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { requireAdminPage } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { EntryComposer } from "@/components/bitacora/entry-composer";
import { EntryTimeline } from "@/components/bitacora/entry-timeline";
import { BitacoraFilters } from "@/components/bitacora/bitacora-filters";
import {
  listDistinctAuthors,
  listDistinctClients,
  listEntries,
  listTagCounts,
} from "@/server/queries/bitacora";
import { logEntryFiltersSchema } from "@/lib/validators/bitacora";
import { formatWeekKey } from "@/lib/reports/iso-week";
import { currentWorkWeek, formatWorkWeekLabel, toDateKey } from "@/lib/bitacora/work-week";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BitacoraPage({ searchParams }: PageProps) {
  const user = await requireAdminPage("/bitacora");
  const raw = await searchParams;

  // Filtros inválidos (una fecha a mano en la URL) no deben tirar la página:
  // se ignoran y se muestra la bitácora sin filtrar.
  const parsed = logEntryFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};

  const [entries, clients, authors, tags] = await Promise.all([
    listEntries(filters),
    listDistinctClients(),
    listDistinctAuthors(),
    listTagCounts(),
  ]);

  const today = toDateKey(new Date());
  const week = currentWorkWeek();
  const weekKey = formatWeekKey(week.isoYear, week.isoWeek);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bitácora</h1>
          <p className="text-sm text-muted-foreground">
            El cuaderno de a bordo del departamento — llamadas, incidencias,
            configuraciones y visitas, día a día.
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2 shrink-0">
          <Link href={`/bitacora/semana/${weekKey}`}>
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            Recopilatorio de la semana
          </Link>
        </Button>
      </div>

      <EntryComposer defaultDate={today} knownClients={clients} />

      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Entradas</h2>
          <p className="text-xs text-muted-foreground">
            Semana en curso: {formatWorkWeekLabel(week.isoYear, week.isoWeek)}
          </p>
        </div>

        {(authors.length > 0 || tags.length > 0) && (
          <BitacoraFilters authors={authors} tags={tags} />
        )}

        <EntryTimeline
          entries={entries}
          currentEmail={user.email}
          knownClients={clients}
          emptyMessage={
            hasFilters
              ? "Ninguna entrada cuadra con estos filtros. Prueba a limpiarlos."
              : "Todavía no hay entradas. Escribe la primera arriba."
          }
        />
      </div>
    </div>
  );
}
