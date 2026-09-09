import { NextResponse } from "next/server";

import { BitacoraPdfDocument } from "@/components/bitacora/bitacora-pdf-document";
import { loadWeekForExport, logExport } from "../_shared";

export const dynamic = "force-dynamic";

/** Recopilatorio semanal en PDF, para adjuntar o imprimir. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ weekKey: string }> },
) {
  const { weekKey } = await params;
  const loaded = await loadWeekForExport(weekKey);
  if (!loaded.ok) return loaded.response;

  // Import dinámico para que @react-pdf/renderer no crashee el Lambda en
  // cold-start — mismo motivo que en el export de informes.
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BitacoraPdfDocument({ summary: loaded.summary }) as any,
  );

  await logExport(loaded.userId, "bitacora_pdf", weekKey, loaded.summary.totals.entries);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bitacora-${weekKey}.pdf"`,
    },
  });
}
