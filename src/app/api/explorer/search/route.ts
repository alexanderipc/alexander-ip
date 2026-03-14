import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";

interface PatentData {
  patentNumber?: string;
  applicationNumber?: string;
  assignee?: string;
  inventor?: string;
  title?: string;
  [key: string]: unknown;
}

interface PortfolioData {
  patents: PatentData[];
  _slug?: string;
  [key: string]: unknown;
}

// In-memory portfolio index (built once on cold start)
const portfolioIndex = new Map<string, PortfolioData>();
let loaded = false;

function indexPortfolio(data: PortfolioData, slug: string) {
  data._slug = slug;
  portfolioIndex.set(slug, data);

  const extras = new Set<string>();
  for (const p of data.patents) {
    const nums = [p.patentNumber, p.applicationNumber].filter(Boolean) as string[];
    for (const num of nums) {
      const norm = num.replace(/[\s,]/g, "").toLowerCase();
      portfolioIndex.set(norm, data);
      portfolioIndex.set(num.toLowerCase(), data);
    }
    if (p.assignee) extras.add(p.assignee.toLowerCase());
    if (p.inventor) extras.add(p.inventor.toLowerCase());
    if (p.title) extras.add(p.title.toLowerCase());
  }
  for (const key of extras) portfolioIndex.set(key, data);
}

function loadPortfolios() {
  if (loaded) return;
  loaded = true;

  // Load from public/explorer/data/ subfolders
  const dataDir = join(process.cwd(), "public", "explorer", "data");
  if (!existsSync(dataDir)) return;

  for (const entry of readdirSync(dataDir)) {
    const entryPath = join(dataDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const jsonPath = join(entryPath, "portfolio.json");
    if (!existsSync(jsonPath)) continue;

    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf8")) as PortfolioData;
      if (!data.patents?.length) continue;
      indexPortfolio(data, entry);
    } catch {
      // skip malformed files
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    loadPortfolios();

    const { query } = await req.json();
    if (!query)
      return NextResponse.json(
        { error: "Search query required" },
        { status: 400 }
      );

    const normalized = (query as string).trim().toLowerCase();
    const stripped = normalized.replace(/[\s,]/g, "");

    // Try exact match, then stripped, then partial
    let result = portfolioIndex.get(normalized) || portfolioIndex.get(stripped);

    if (!result) {
      for (const [key, data] of portfolioIndex) {
        if (key.includes(normalized) || normalized.includes(key)) {
          result = data;
          break;
        }
      }
    }

    if (result) {
      return NextResponse.json({
        source: "local",
        patents: result.patents,
        slug: result._slug || "",
      });
    }

    return NextResponse.json(
      { error: `No portfolio found for "${query}".` },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
