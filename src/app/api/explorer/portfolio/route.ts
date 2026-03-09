import { NextRequest, NextResponse } from "next/server";
import { dkgGet, nquadsToPatents } from "@/lib/explorer/dkg";
import type { PortfolioResponse } from "@/lib/explorer/types";
import fallbackData from "@/data/moye-portfolio.json";

// Vercel has no persistent filesystem — use in-memory cache
const cache = new Map<string, PortfolioResponse>();

// Allow up to 30s for data fetching
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Parse body once upfront so it's available in the catch block
  const body = await req.json().catch(() => ({ ual: "" }));
  const ual = body.ual || "";

  if (!ual)
    return NextResponse.json({ error: "UAL required" }, { status: 400 });

  try {
    console.log(`[Explorer] Fetching portfolio for: ${ual}`);
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
    };

    // Cache in memory
    cache.set(ual, { ...result, fetchedAt: new Date().toISOString() });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Explorer] Portfolio fetch error:", (err as Error).message);

    // Try in-memory cache
    const cached = cache.get(ual);
    if (cached) {
      return NextResponse.json({
        ...cached,
        source: "cache" as const,
        error: (err as Error).message,
      });
    }

    // Fallback to bundled moye-portfolio.json
    return NextResponse.json({
      ...(fallbackData as PortfolioResponse),
      source: "fallback" as const,
      error: (err as Error).message,
    });
  }
}
