import { NextRequest, NextResponse } from "next/server";
import { resolveContextId } from "@/data/context";

const knownMappings: Record<string, string> = {
  "US12236923B2":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "US 12,236,923 B2":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "12236923":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "US2024420671A1":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "US 2024/0420671 A1":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "WO2025254702A1":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "WO 2025/254702 A1":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "19/319,941":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  "PCT/US25/45438":
    "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
  moye: "did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/847382",
};

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query)
      return NextResponse.json(
        { error: "Search query required" },
        { status: 400 }
      );

    const normalized = (query as string).trim().replace(/\s+/g, " ");
    const ual =
      knownMappings[normalized] ||
      knownMappings[normalized.replace(/[\s,]/g, "")] ||
      Object.entries(knownMappings).find(([k]) =>
        normalized.toLowerCase().includes(k.toLowerCase())
      )?.[1];

    if (ual) {
      const contextId = resolveContextId(ual, normalized);
      return NextResponse.json({ ual, matchedBy: "lookup-table", contextId });
    }
    return NextResponse.json(
      { error: `No portfolio found for "${query}". Try a UAL directly.` },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
