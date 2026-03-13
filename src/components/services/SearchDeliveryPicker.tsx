"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, Zap, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  getCurrencyFromBrowserLocale,
  convertPrice,
  getDisplayPrice,
} from "@/lib/pricing";

/* ── Types ──────────────────────────────────────────────── */

interface SearchTier {
  name: string;
  service: string;
  usd: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface DeliveryOption {
  key: string;
  name: string;
  days: number;
  /** Multiplier on base price (1 = standard, 1.5 = 1.5×, 2.5 = 2.5×) */
  multiplier: number;
  icon: "clock" | "zap";
}

/* ── Data ───────────────────────────────────────────────── */

const tiers: SearchTier[] = [
  {
    name: "Basic",
    service: "patent-search-basic",
    usd: 300,
    description:
      "Prior Art Search — published patents relevant to your invention",
    features: [
      "Search of published patents",
      "Detailed patentability report",
      "Key prior art documents identified",
      "Summary and opinion",
    ],
  },
  {
    name: "Standard",
    service: "patent-search-standard",
    usd: 340,
    description:
      "Expanded Prior Art Search — includes web disclosures & non-patent literature",
    features: [
      "Everything in Basic",
      "Web disclosures and non-patent publications",
      "Broader prior art landscape",
      "Enhanced novelty assessment",
    ],
    popular: true,
  },
  {
    name: "Premium",
    service: "patent-search-premium",
    usd: 435,
    description:
      "Expanded Search + Strategy Call to discuss the best way forward",
    features: [
      "Everything in Standard",
      "Live strategy call after search",
      "Personalised filing advice",
      "Jurisdiction recommendations",
    ],
  },
];

const deliveryOptions: DeliveryOption[] = [
  { key: "standard", name: "Standard", days: 21, multiplier: 1, icon: "clock" },
  { key: "rush", name: "Rush", days: 12, multiplier: 1.5, icon: "zap" },
  { key: "express", name: "Express", days: 5, multiplier: 2.5, icon: "zap" },
];

/* ── Component ──────────────────────────────────────────── */

export default function SearchDeliveryPicker() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [delivery, setDelivery] = useState("standard");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(getCurrencyFromBrowserLocale());
  }, []);

  const getTotal = useCallback(
    (tierName: string) => {
      const tier = tiers.find((t) => t.name === tierName);
      if (!tier) return 0;
      const opt = deliveryOptions.find((d) => d.key === delivery)!;
      return Math.round(tier.usd * opt.multiplier);
    },
    [delivery]
  );

  async function handleCheckout(tierName: string) {
    const tier = tiers.find((t) => t.name === tierName);
    if (!tier) return;

    const opt = deliveryOptions.find((d) => d.key === delivery)!;

    setLoading(tierName);
    setError(null);

    try {
      let body: Record<string, unknown>;

      if (opt.key === "standard") {
        // Standard: use the fixed-price service key
        body = { service: tier.service };
      } else {
        // Rush/Express: use custom checkout with multiplied price
        const total = getTotal(tierName);
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
          description: `Patent Search (${tier.name}) — ${opt.days}-day ${opt.name} delivery`,
          timelineDays: opt.days,
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
        setLoading(null);
      }
    } catch {
      setError("Something went wrong. Please check your connection.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-12">
      {/* Delivery Timeline Picker */}
      <div className="text-center">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Choose Delivery Timeline
        </h3>
        <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
          {deliveryOptions.map((opt) => {
            const isSelected = delivery === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setDelivery(opt.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-white text-navy shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.icon === "zap" ? (
                  <Zap className={`w-4 h-4 ${isSelected ? "text-amber-500" : ""}`} />
                ) : (
                  <Clock className={`w-4 h-4 ${isSelected ? "text-teal" : ""}`} />
                )}
                {opt.name}
                <span className="text-xs text-slate-400">
                  {opt.days} days
                </span>
              </button>
            );
          })}
        </div>
        {delivery !== "standard" && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            {delivery === "rush" ? "1.5\u00d7" : "2.5\u00d7"} standard price for{" "}
            {deliveryOptions.find((d) => d.key === delivery)?.days}-day delivery
          </p>
        )}
      </div>

      {/* Tier Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((tier) => {
          const opt = deliveryOptions.find((d) => d.key === delivery)!;
          const total = getTotal(tier.name);
          const isLoading = loading === tier.name;

          return (
            <div
              key={tier.name}
              className={`flex flex-col bg-white rounded-2xl border p-6 ${
                tier.popular
                  ? "border-2 border-teal ring-1 ring-teal/20"
                  : "border-slate-200"
              }`}
            >
              {tier.popular && (
                <div className="text-center mb-4">
                  <Badge variant="teal">Most Popular</Badge>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-navy mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {tier.description}
                </p>
                <div className="text-4xl font-bold text-navy">
                  {delivery === "standard" ? (
                    <StandardPrice service={tier.service} currency={currency} />
                  ) : (
                    convertPrice(total, currency)
                  )}
                </div>
                {currency === "GBP" && (
                  <span className="text-sm text-slate-400">+VAT</span>
                )}
                <p className="text-sm text-slate-400 mt-2">
                  {opt.days}-day delivery
                </p>
              </div>
              <div className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => handleCheckout(tier.name)}
                size="md"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting&hellip;
                  </>
                ) : (
                  `Order ${tier.name}`
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-3 bg-red-50 px-4 py-2 rounded-lg text-center max-w-md mx-auto">
          {error}
        </p>
      )}
    </div>
  );
}

/* Helper to show the pre-set Stripe price for standard delivery */
function StandardPrice({
  service,
  currency,
}: {
  service: string;
  currency: string;
}) {
  return <>{getDisplayPrice(service, currency)}</>;
}
