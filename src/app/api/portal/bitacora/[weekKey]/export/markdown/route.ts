import { NextResponse } from "next/server";

import { summaryToMarkdown } from "@/lib/bitacora/to-markdown";
import { loadWeekForExport, logExport } from "../_shared";

export const dynamic = "force-dynamic";

/** Recopilatorio semanal como fichero Markdown descargable. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ weekKey: string }> },
) {
  const { weekKey } = await params;
  const loaded = await loadWeekForExport(weekKey);
  if (!loaded.ok) return loaded.response;

  const markdown = summaryToMarkdown(loaded.summary);
  await logExport(
    loaded.userId,
    "bitacora_markdown",
    weekKey,
    loaded.summary.totals.entries,
  );

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="bitacora-${weekKey}.md"`,
    },
  });
}
