"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOffer } from "@/app/admin/actions";
import { getServiceLabel, DEFAULT_TIMELINES } from "@/lib/portal/status";
import type { ServiceType } from "@/lib/supabase/types";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";

const SERVICE_OPTIONS: ServiceType[] = [
  "consultation",
  "patent_search",
  "patent_drafting",
  "patent_prosecution",
  "international_filing",
  "fto",
  "illustrations",
  "filing",
  "ip_valuation",
  "custom",
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (\u00a3)" },
  { value: "EUR", label: "EUR (\u20ac)" },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "\u00a3",
  EUR: "\u20ac",
};

export default function NewOfferPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("custom");
  const [timelineDays, setTimelineDays] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("USD");

  function handleServiceChange(value: ServiceType) {
    setServiceType(value);
    const defaultDays = DEFAULT_TIMELINES[value];
    setTimelineDays(defaultDays ? String(defaultDays) : "");
  }

  const displayAmount = amount ? parseFloat(amount).toFixed(2) : "0.00";
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await createOffer(formData);
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/admin/offers");
          }, 2000);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create offer"
        );
      }
    });
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-teal-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-navy mb-2">
            Offer Sent
          </h2>
          <p className="text-slate-500">The client will receive an email with a payment link.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/offers"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offers
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-6">New Custom Offer</h1>

      <form action={handleSubmit} className="max-w-2xl space-y-6">
        {/* Client */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Client
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client_email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Client Email *
              </label>
              <input
                id="client_email"
                name="client_email"
                type="email"
                required
                placeholder="client@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="client_name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Client Name
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                placeholder="John Doe"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Offer Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Offer Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="service_type"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Service Type *
              </label>
              <select
                id="service_type"
                name="service_type"
                required
                value={serviceType}
                onChange={(e) =>
                  handleServiceChange(e.target.value as ServiceType)
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SERVICE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {getServiceLabel(st)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Offer Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g., Patent Drafting — Solar Panel Controller"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="What the client will receive &#8212; shown on the offer page"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Pricing & Timeline
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Price ({symbol}) *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                required
                min="0.50"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 850.00"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {symbol}{displayAmount} + VAT where applicable
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="timeline_days"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Duration (days)
              </label>
              <input
                id="timeline_days"
                name="timeline_days"
                type="number"
                min="1"
                value={timelineDays}
                onChange={(e) => setTimelineDays(e.target.value)}
                placeholder="e.g., 30"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {isPending ? "Sending..." : "Send Offer"}
          </button>
          <Link
            href="/admin/offers"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
