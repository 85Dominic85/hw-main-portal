import { NextResponse } from "next/server";

import { summaryToNotionMarkdown } from "@/lib/bitacora/to-markdown";
import { loadWeekForExport, logExport } from "../_shared";

export const dynamic = "force-dynamic";

/**
 * Recopilatorio semanal en Markdown con divisores, para pegar en Notion.
 * No usa la API de Notion — igual que el export de informes, el flujo es
 * copiar y pegar.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ weekKey: string }> },
) {
  const { weekKey } = await params;
  const loaded = await loadWeekForExport(weekKey);
  if (!loaded.ok) return loaded.response;

  const markdown = summaryToNotionMarkdown(loaded.summary);
  await logExport(
    loaded.userId,
    "bitacora_notion",
    weekKey,
    loaded.summary.totals.entries,
  );

  return new NextResponse(markdown, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
