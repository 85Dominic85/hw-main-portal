import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { requireAdminPage } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { WeeklyScorecard } from "@/components/bitacora/weekly-scorecard";
import { WeeklyDiary } from "@/components/bitacora/weekly-diary";
import { WeeklyExportButtons } from "@/components/bitacora/weekly-export-buttons";
import { getWeekEntries } from "@/server/queries/bitacora";
import { summarizeWeek } from "@/lib/bitacora/weekly-summary";
import {
  formatWeekKey,
  getIsoWeek,
  isoWeekToRange,
  nextIsoWeek,
  parseWeekKey,
} from "@/lib/reports/iso-week";
import { currentWorkWeek } from "@/lib/bitacora/work-week";

export const dynamic = "force-dynamic";

/** Vistas del recopilatorio. Las cuatro salen del mismo `summarizeWeek()`. */
const VIEWS = ["dias", "temas", "personas"] as const;
type View = (typeof VIEWS)[number];

function isView(v: string | undefined): v is View {
  return VIEWS.includes(v as View);
}

/**
 * Semana ISO anterior. `iso-week.ts` tiene `nextIsoWeek` pero no su pareja, así
 * que se resuelve retrocediendo 7 días desde el lunes y volviendo a preguntar
 * la semana — reusa el cálculo ya testeado en lugar de reimplementarlo.
 */
function prevIsoWeek(isoYear: number, isoWeek: number) {
  const monday = isoWeekToRange(isoYear, isoWeek).from;
  const before = new Date(monday);
  before.setUTCDate(monday.getUTCDate() - 7);
  return getIsoWeek(before);
}

interface PageProps {
  params: Promise<{ weekKey: string }>;
  searchParams: Promise<{ vista?: string }>;
}

export default async function BitacoraWeekPage({ params, searchParams }: PageProps) {
  await requireAdminPage("/bitacora");

  const { weekKey } = await params;
  const parsedKey = parseWeekKey(weekKey);
  if (!parsedKey) notFound();

  const { isoYear, isoWeek } = parsedKey;
  const { vista } = await searchParams;
  const view: View = isView(vista) ? vista : "dias";

  const entries = await getWeekEntries(isoYear, isoWeek);
  const summary = summarizeWeek(entries, isoYear, isoWeek);

  const prev = prevIsoWeek(isoYear, isoWeek);
  const next = nextIsoWeek(isoYear, isoWeek);
  const current = currentWorkWeek();
  const isFuture =
    isoYear > current.isoYear ||
    (isoYear === current.isoYear && isoWeek >= current.isoWeek);

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5">
          <Link href="/bitacora">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Bitácora
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Recopilatorio de la semana
            </h1>
            <p className="font-mono text-sm text-muted-foreground">{summary.label}</p>
          </div>
          <WeeklyExportButtons
            weekKey={formatWeekKey(isoYear, isoWeek)}
            hasEntries={summary.totals.entries > 0}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/bitacora/semana/${formatWeekKey(prev.isoYear, prev.isoWeek)}`}>
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Semana {prev.isoWeek}
            </Link>
          </Button>
          {!isFuture && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/bitacora/semana/${formatWeekKey(next.isoYear, next.isoWeek)}`}>
                Semana {next.isoWeek}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <WeeklyScorecard summary={summary} />

      <hr className="border-border" />

      <WeeklyDiary summary={summary} view={view} weekKey={weekKey} />
    </div>
  );
}
