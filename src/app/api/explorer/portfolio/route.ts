import { NextRequest, NextResponse } from "next/server";
import { dkgGet, nquadsToPatents } from "@/lib/explorer/dkg";
import type { PortfolioResponse } from "@/lib/explorer/types";
import fallbackData from "@/data/moye-portfolio.json";

// Vercel has no persistent filesystem — use in-memory cache
const cache = new Map<string, PortfolioResponse>();

// Allow up to 30s for DKG polling
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { ual } = await req.json();
    if (!ual)
      return NextResponse.json({ error: "UAL required" }, { status: 400 });

    console.log(`[Explorer] Fetching portfolio for: ${ual}`);
    const nquads = await dkgGet(ual);
    const patents = nquadsToPatents(nquads);

    if (!patents.length)
      return NextResponse.json(
        { error: "No patents found in Knowledge Asset" },
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

    const body = await req.clone().json().catch(() => ({ ual: "" }));
    const ual = body.ual || "";

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
