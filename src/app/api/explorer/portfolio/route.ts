import { NextRequest, NextResponse } from "next/server";
import { dkgGet, nquadsToPatents } from "@/lib/explorer/dkg";
import type { PortfolioResponse } from "@/lib/explorer/types";
import fallbackData from "@/data/moye-portfolio.json";

// Allow up to 30s for DKG refresh
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ ual: "", refresh: false }));
  const ual = body.ual || "";
  const refresh = body.refresh === true;

  if (!ual)
    return NextResponse.json({ error: "UAL required" }, { status: 400 });

  // Default: serve cached portfolio data instantly (no DKG wait)
  if (!refresh) {
    return NextResponse.json({
      ...(fallbackData as PortfolioResponse),
      source: "cached" as const,
    });
  }

  // Refresh mode: hit DKG for fresh data
  try {
    console.log(`[Explorer] Refreshing portfolio from DKG: ${ual}`);
    const nquads = await dkgGet(ual);
    const patents = nquadsToPatents(nquads);

    if (!patents.length)
      return NextResponse.json(
        { error: "No patents found in portfolio" },
        { status: 404 }
      );

    const result: PortfolioResponse = {
      source: "dkg-live",
      ual,
      patents,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Explorer] DKG refresh failed:", (err as Error).message);

    // Fall back to bundled data
    return NextResponse.json({
      ...(fallbackData as PortfolioResponse),
      source: "cached" as const,
      error: (err as Error).message,
    });
  }
}
