import Link from "next/link";
import { Plus, FileText, Clock, CheckCircle2, Archive } from "lucide-react";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/session";
import { listReports } from "@/server/queries/reports";
import { formatWeekLabel, parseWeekKey } from "@/lib/reports/iso-week";
import { DeleteDraftButton } from "@/components/reports/delete-draft-button";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  let userError: string | null = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    userError = err instanceof Error ? err.message : String(err);
  }
  const isAdmin = user?.role === "admin";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Informes</h1>
          <p className="text-sm text-muted-foreground">
            Informes semanales y mensuales del departamento Hardware.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo informe
            </Link>
          </Button>
        )}
      </div>

      {userError && (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-destructive">Error en getCurrentUser</p>
            <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{userError}</pre>
          </CardContent>
        </Card>
      )}

      <Suspense fallback={<ReportsListSkeleton />}>
        <ReportsList isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}

async function ReportsList({ isAdmin }: { isAdmin: boolean }) {
  let reports: Awaited<ReturnType<typeof listReports>>;
  try {
    reports = await listReports(isAdmin ? "admin" : "viewer");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm font-semibold text-destructive">Error al cargar informes</p>
          <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{msg}</pre>
        </CardContent>
      </Card>
    );
  }

  if (!reports.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="font-medium">No hay informes todavía</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? 'Pulsa "Nuevo informe" para crear el primero.'
                : "Los informes publicados aparecerán aquí."}
            </p>
          </div>
          {isAdmin && (
            <Button asChild variant="outline">
              <Link href="/reports/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear primer informe
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const weekInfo =
          r.type === "weekly" && r.isoYear && r.isoWeek
            ? parseWeekKey(r.periodKey)
            : null;
        const periodLabel =
          weekInfo
            ? formatWeekLabel(weekInfo.isoYear, weekInfo.isoWeek)
            : r.periodKey;

        const href =
          r.status === "draft" && isAdmin ? `/reports/${r.id}/edit` : `/reports/${r.id}`;

        return (
          <Card key={r.id} className="transition-colors hover:bg-accent/30">
            <CardContent className="flex items-center gap-4 py-4">
              <Link href={href} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{periodLabel}</p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                {r.globalStatus && (
                  <span
                    className={
                      r.globalStatus === "verde"
                        ? "text-status-ok"
                        : r.globalStatus === "amarillo"
                          ? "text-status-warn"
                          : "text-status-danger"
                    }
                  >
                    ●
                  </span>
                )}
                <ReportStatusBadge status={r.status} />
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {r.publishedAt
                    ? new Date(r.publishedAt).toLocaleDateString("es-ES")
                    : new Date(r.createdAt).toLocaleDateString("es-ES")}
                </span>
                {isAdmin && r.status === "draft" && <DeleteDraftButton reportId={r.id} />}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <Badge variant="outline" className="gap-1 text-status-ok border-status-ok/40">
        <CheckCircle2 className="h-3 w-3" />
        Publicado
      </Badge>
    );
  }
  if (status === "archived") {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Archive className="h-3 w-3" />
        Archivado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      Borrador
    </Badge>
  );
}

function ReportsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
      ))}
    </div>
  );
}
