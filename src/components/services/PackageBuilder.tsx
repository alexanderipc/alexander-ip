"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  getCurrencyFromBrowserLocale,
  convertPrice,
} from "@/lib/pricing";

/* ── Data ────────────────────────────────────────────────── */

interface ComplexityTier {
  key: string;
  name: string;
  description: string;
  usd: number;
  service: string;
  images: string[];
}

interface Extra {
  key: string;
  name: string;
  usd: number;
  note: string;
}

interface Timeline {
  key: string;
  name: string;
  days: number;
  surchargeUsd: number | null; // null = 100% of base
}

const complexityTiers: ComplexityTier[] = [
  {
    key: "simple",
    name: "Simple Invention",
    description: "Mechanical inventions with few moving parts",
    usd: 895,
    service: "patent-drafting-simple",
    images: ["simple-bracket-mount.png", "simple-clamp-ring.png"],
  },
  {
    key: "mid",
    name: "Mid-Tier Invention",
    description: "Electrical/electronic systems, moderate complexity",
    usd: 1075,
    service: "patent-drafting-mid",
    images: ["mid-snowboard-bindings.png", "mid-modular-device.png"],
  },
  {
    key: "complex",
    name: "Complex Invention",
    description: "Software, AI, biochemistry, advanced systems",
    usd: 1255,
    service: "patent-drafting-complex",
    images: ["complex-cloud-wearable.png", "complex-industrial-machine.png"],
  },
];

const extras: Extra[] = [
  {
    key: "search",
    name: "Patent Search",
    usd: 340,
    note: "Prior art search included in timeline",
  },
  {
    key: "illustrations-created",
    name: "Illustrations (Created)",
    usd: 315,
    note: "Professional patent drawings",
  },
  {
    key: "illustrations-formatted",
    name: "Illustrations (Formatted)",
    usd: 45,
    note: "Your drawings, reformatted",
  },
  {
    key: "filing",
    name: "Filing / Submission",
    usd: 225,
    note: "Filed on your behalf",
  },
];

const timelines: Timeline[] = [
  { key: "standard", name: "Standard", days: 45, surchargeUsd: 0 },
  { key: "30", name: "Express", days: 30, surchargeUsd: 180 },
  { key: "21", name: "Rush", days: 21, surchargeUsd: 360 },
  { key: "14", name: "Urgent", days: 14, surchargeUsd: 630 },
  { key: "7", name: "Emergency", days: 7, surchargeUsd: null },
];

/* ── Flow line types & helpers ────────────────────────────── */

interface FlowLine {
  path: string; // SVG path d attribute
  active: boolean;
}

function buildSmoothPath(
  srcX: number,
  srcY: number,
  dstX: number,
  dstY: number,
  midY: number,
  radius = 16
): string {
  /* Straight vertical when source and dest are aligned */
  if (Math.abs(dstX - srcX) < 1) {
    return `M ${srcX} ${srcY} L ${dstX} ${dstY}`;
  }

  /* Clamp radius so it fits within the available vertical/horizontal space */
  const r = Math.min(
    radius,
    Math.abs(dstX - srcX) / 2,
    Math.abs(midY - srcY) / 2,
    Math.abs(dstY - midY) / 2
  );

  const dx = dstX > srcX ? 1 : -1; // direction sign

  return [
    `M ${srcX} ${srcY}`,
    `L ${srcX} ${midY - r}`,                        // vertical down to first corner
    `Q ${srcX} ${midY} ${srcX + dx * r} ${midY}`,   // smooth corner turn
    `L ${dstX - dx * r} ${midY}`,                    // horizontal across
    `Q ${dstX} ${midY} ${dstX} ${midY + r}`,         // smooth corner turn
    `L ${dstX} ${dstY}`,                              // vertical down to destination
  ].join(" ");
}

function getMidpointY(
  sourceRefs: (HTMLDivElement | null)[],
  destRefs: (HTMLDivElement | null)[],
  containerRect: DOMRect,
  bias = 0.5 // 0 = source bottom, 1 = dest top; higher = closer to dest cards
): number {
  let maxSourceBottom = 0;
  for (const el of sourceRefs) {
    if (el) {
      const bottom = el.getBoundingClientRect().bottom - containerRect.top;
      if (bottom > maxSourceBottom) maxSourceBottom = bottom;
    }
  }
  let minDestTop = Infinity;
  for (const el of destRefs) {
    if (el) {
      const top = el.getBoundingClientRect().top - containerRect.top;
      if (top < minDestTop) minDestTop = top;
    }
  }
  return maxSourceBottom + (minDestTop - maxSourceBottom) * bias;
}

/* ── Component ───────────────────────────────────────────── */

export default function PackageBuilder() {
  const [complexity, setComplexity] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(
    new Set()
  );
  const [timeline, setTimeline] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Refs for SVG line drawing */
  const containerRef = useRef<HTMLDivElement>(null);
  const complexityRefs = useRef<(HTMLDivElement | null)[]>([]);
  const extrasRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lines1, setLines1] = useState<FlowLine[]>([]);
  const [lines2, setLines2] = useState<FlowLine[]>([]);

  /* Detect currency */
  useEffect(() => {
    setCurrency(getCurrencyFromBrowserLocale());
  }, []);

  /* Calculate orthogonal line positions */
  const updateLines = useCallback(() => {
    if (!containerRef.current || !complexity) {
      setLines1([]);
      setLines2([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const selectedIdx = complexityTiers.findIndex(
      (t) => t.key === complexity
    );
    const selectedEl = complexityRefs.current[selectedIdx];
    if (!selectedEl) return;

    const srcRect = selectedEl.getBoundingClientRect();
    const srcX = srcRect.left + srcRect.width / 2 - containerRect.left;
    const srcY = srcRect.bottom - containerRect.top;

    /* Midpoint Y between complexity row and extras row — bias lower to clear heading text */
    const midY1 = getMidpointY(
      complexityRefs.current,
      extrasRefs.current,
      containerRect,
      0.82
    );

    /* Orthogonal lines from complexity to extras */
    const newLines1: FlowLine[] = [];
    extrasRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dstX = rect.left + rect.width / 2 - containerRect.left;
      const dstY = rect.top - containerRect.top;
      newLines1.push({
        path: buildSmoothPath(srcX, srcY, dstX, dstY, midY1),
        active: selectedExtras.has(extras[i].key),
      });
    });
    setLines1(newLines1);

    /* Lines from extras (or complexity) to timeline */
    const activeExtrasEls = extrasRefs.current.filter(
      (_, i) => selectedExtras.has(extras[i].key)
    );
    const sourceEls =
      activeExtrasEls.length > 0 ? activeExtrasEls : [selectedEl];
    const midSource = sourceEls[Math.floor(sourceEls.length / 2)];
    if (!midSource) return;

    const mRect = midSource.getBoundingClientRect();
    const mX = mRect.left + mRect.width / 2 - containerRect.left;
    const mY = mRect.bottom - containerRect.top;

    /* Midpoint Y between extras row and timeline row — bias lower to clear heading text */
    const midY2 = getMidpointY(
      extrasRefs.current,
      timelineRefs.current,
      containerRect,
      0.82
    );

    const newLines2: FlowLine[] = [];
    timelines.forEach((tl, i) => {
      const el = timelineRefs.current[i];
      if (!el) return;
      const tRect = el.getBoundingClientRect();
      const tX = tRect.left + tRect.width / 2 - containerRect.left;
      const tY = tRect.top - containerRect.top;
      newLines2.push({
        path: buildSmoothPath(mX, mY, tX, tY, midY2),
        active: timeline === tl.key,
      });
    });
    setLines2(newLines2);
  }, [complexity, selectedExtras, timeline]);

  useEffect(() => {
    updateLines();
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [updateLines]);

  /* Calculate total */
  const getTotal = useCallback(() => {
    if (!complexity) return 0;
    const tier = complexityTiers.find((t) => t.key === complexity);
    if (!tier) return 0;
    let total = tier.usd;
    for (const extra of selectedExtras) {
      const e = extras.find((ex) => ex.key === extra);
      if (e) total += e.usd;
    }
    if (timeline) {
      const tl = timelines.find((t) => t.key === timeline);
      if (tl) {
        if (tl.surchargeUsd !== null) {
          total += tl.surchargeUsd;
        } else {
          total += tier.usd; // 100% of base
        }
      }
    }
    return total;
  }, [complexity, selectedExtras, timeline]);

  /* Toggle an extra */
  const toggleExtra = (key: string) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* Checkout handler */
  async function handleCheckout() {
    if (!complexity) return;
    setLoading(true);
    setError(null);

    const tier = complexityTiers.find((t) => t.key === complexity)!;
    const total = getTotal();
    const hasExtras = selectedExtras.size > 0;
    const hasRush = timeline && timeline !== "standard";

    try {
      let body: Record<string, unknown>;

      if (!hasExtras && !hasRush) {
        /* Simple: use the standard service checkout */
        body = { service: tier.service };
      } else {
        /* Custom: build description and use total */
        const parts = [tier.name + " drafting"];
        for (const extra of selectedExtras) {
          const e = extras.find((ex) => ex.key === extra);
          if (e) parts.push(e.name);
        }
        if (hasRush) {
          const tl = timelines.find((t) => t.key === timeline);
          if (tl) parts.push(`${tl.days}-day delivery`);
        }

        /* Convert USD total to the currency's smallest unit */
        const currencyMap: Record<string, { code: string; rate: number }> = {
          USD: { code: "usd", rate: 1 },
          GBP: { code: "gbp", rate: 0.74 },
          EUR: { code: "eur", rate: 0.96 },
        };
        const curr = currencyMap[currency] || currencyMap.USD;
        const amountInSmallestUnit = Math.round(total * curr.rate * 100);

        body = {
          service: "custom",
          customAmount: amountInSmallestUnit,
          currency: curr.code,
          description: `Patent Drafting Package: ${parts.join(" + ")}`,
        };
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please check your connection.");
      setLoading(false);
    }
  }

  /* ── Render ──────────────────────────────────────────── */
  const isExtrasEnabled = complexity !== null;
  const isTimelineEnabled = complexity !== null;

  return (
    <div ref={containerRef} className="relative">
      {/* SVG connector overlay — desktop only */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden md:block"
        style={{ overflow: "visible" }}
      >
        {lines1.map((line, i) => (
          <path
            key={`l1-${i}`}
            d={line.path}
            fill="none"
            stroke={line.active ? "#14b8a6" : "#94a3b8"}
            strokeWidth={line.active ? 2.5 : 1.5}
            strokeDasharray={line.active ? "none" : "6 4"}
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />
        ))}
        {lines2.map((line, i) => (
          <path
            key={`l2-${i}`}
            d={line.path}
            fill="none"
            stroke={line.active ? "#14b8a6" : "#94a3b8"}
            strokeWidth={line.active ? 2.5 : 1.5}
            strokeDasharray={line.active ? "none" : "6 4"}
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />
        ))}
      </svg>

      {/* ── Row 1: Complexity ──────────────────────────── */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Step 1 &mdash; Select your invention&apos;s complexity
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {complexityTiers.map((tier, i) => {
          const isSelected = complexity === tier.key;
          return (
            <div
              key={tier.key}
              ref={(el) => { complexityRefs.current[i] = el; }}
              onClick={() => {
                setComplexity(tier.key);
                if (!timeline) setTimeline("standard");
              }}
              className={`cursor-pointer rounded-xl border-2 p-6 text-center transition-all duration-200 ${
                isSelected
                  ? "border-teal ring-2 ring-teal/20 bg-teal/5 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Thumbnail images */}
              <div className="flex flex-col gap-3 mb-4">
                {tier.images.map((img) => (
                  <div
                    key={img}
                    className="w-full aspect-[4/3] relative rounded-lg overflow-hidden bg-slate-50 border border-slate-200"
                  >
                    <Image
                      src={`/images/diagrams/${img}`}
                      alt={`${tier.name} example`}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>

              <h4 className="text-lg font-semibold text-navy mb-1">
                {tier.name}
              </h4>
              <p className="text-sm text-slate-500 mb-3">
                {tier.description}
              </p>
              <div className="text-2xl font-bold text-navy">
                {convertPrice(tier.usd, currency)}
                {currency === "GBP" && (
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    +VAT
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile connector ───────────────────────────── */}
      {complexity && (
        <div className="flex justify-center py-4 md:hidden">
          <div className="w-px h-8 border-l-2 border-dashed border-teal/40" />
        </div>
      )}

      {/* ── Row 2: Recommended Extras ────────────────────── */}
      <div className={`mt-8 md:mt-10 ${!isExtrasEnabled ? "opacity-40 pointer-events-none" : ""}`}>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Step 2 &mdash; Include what you need
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Most clients add illustrations and filing. Only skip these if you can handle them yourself.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {extras.map((extra, i) => {
            const isSelected = selectedExtras.has(extra.key);
            return (
              <div
                key={extra.key}
                ref={(el) => { extrasRefs.current[i] = el; }}
                onClick={() => isExtrasEnabled && toggleExtra(extra.key)}
                className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-teal ring-2 ring-teal/20 bg-teal/5 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <h4 className="text-sm font-semibold text-navy mb-1">
                  {extra.name}
                </h4>
                <p className="text-xs text-slate-400 mb-2">{extra.note}</p>
                <div className="text-lg font-bold text-navy">
                  +{convertPrice(extra.usd, currency)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile connector ───────────────────────────── */}
      {complexity && (
        <div className="flex justify-center py-4 md:hidden">
          <div className="w-px h-8 border-l-2 border-dashed border-teal/40" />
        </div>
      )}

      {/* ── Row 3: Delivery Timeline ───────────────────── */}
      <div className={`mt-8 md:mt-10 ${!isTimelineEnabled ? "opacity-40 pointer-events-none" : ""}`}>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Step 3 &mdash; Choose delivery timeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 relative z-10">
          {timelines.map((tl, i) => {
            const isSelected = timeline === tl.key;
            const tier = complexityTiers.find((t) => t.key === complexity);
            const surchargeDisplay =
              tl.surchargeUsd === null
                ? tier
                  ? `+${convertPrice(tier.usd, currency)}`
                  : "+100%"
                : tl.surchargeUsd === 0
                ? "Included"
                : `+${convertPrice(tl.surchargeUsd, currency)}`;

            return (
              <div
                key={tl.key}
                ref={(el) => { timelineRefs.current[i] = el; }}
                onClick={() => isTimelineEnabled && setTimeline(tl.key)}
                className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-teal ring-2 ring-teal/20 bg-teal/5 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <h4 className="text-sm font-semibold text-navy mb-1">
                  {tl.name}
                </h4>
                <p className="text-xs text-slate-400 mb-2">{tl.days} days</p>
                <div className="text-sm font-bold text-navy">
                  {surchargeDisplay}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Total bar ──────────────────────────────────── */}
      {complexity && (
        <div className="mt-10 p-6 bg-gradient-to-r from-navy to-navy-light rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-300 mb-1">Package total</p>
            <div className="text-3xl font-bold text-white">
              {convertPrice(getTotal(), currency)}
              {currency === "GBP" && (
                <span className="text-base font-normal text-slate-300 ml-2">
                  +VAT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {complexityTiers.find((t) => t.key === complexity)?.name}
              {selectedExtras.size > 0 && (
                <>
                  {" + "}
                  {[...selectedExtras]
                    .map((k) => extras.find((e) => e.key === k)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </>
              )}
              {timeline && timeline !== "standard" && (
                <>
                  {" + "}
                  {timelines.find((t) => t.key === timeline)?.days}-day delivery
                </>
              )}
            </p>
          </div>
          <Button
            onClick={handleCheckout}
            size="lg"
            disabled={loading}
            className="flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting&hellip;
              </>
            ) : (
              "Order Now"
            )}
          </Button>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-3 bg-red-50 px-4 py-2 rounded-lg relative z-10">
          {error}
        </p>
      )}

      {/* Gov fees note */}
      <p className="text-center text-sm text-slate-400 mt-6 relative z-10">
        Government patent office fees are paid by you directly to the patent
        office and are not included above.
      </p>
    </div>
  );
}
