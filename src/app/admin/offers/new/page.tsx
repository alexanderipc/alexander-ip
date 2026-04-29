"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOffer } from "@/app/admin/actions";
import { getServiceLabel, DEFAULT_TIMELINES } from "@/lib/portal/status";
import type { ServiceType } from "@/lib/supabase/types";
import {
  PATENT_OFFICES,
  WIPO_RECEIVING_OFFICES,
  getOfficeCurrency,
  convertCurrency,
} from "@/lib/pricing";
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
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF ",
};

const OFFICE_KEYS = Object.keys(PATENT_OFFICES);

export default function NewOfferPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("custom");
  const [timelineDays, setTimelineDays] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [installments, setInstallments] = useState<string>("1");

  // Official fees state
  const [includeOfficialFees, setIncludeOfficialFees] = useState(false);
  const [feeOffice, setFeeOffice] = useState("EPO");
  const [feeSubOffice, setFeeSubOffice] = useState("EPO");
  const [officialFeeAmount, setOfficialFeeAmount] = useState<string>("");
  const [coverFeeAmount, setCoverFeeAmount] = useState<string>("");

  function handleServiceChange(value: ServiceType) {
    setServiceType(value);
    const defaultDays = DEFAULT_TIMELINES[value];
    setTimelineDays(defaultDays ? String(defaultDays) : "");
  }

  // Derive office currency
  const effectiveOffice = feeOffice === "WIPO" ? feeSubOffice : feeOffice;
  const { currency: feeCurrency, symbol: feeCurrencySymbol } = getOfficeCurrency(
    feeOffice,
    feeOffice === "WIPO" ? feeSubOffice : null
  );
  const isFxConversion = feeCurrency !== currency;

  const displayAmount = amount ? parseFloat(amount).toFixed(2) : "0.00";
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  // Summary calculations
  const professionalFees = amount ? parseFloat(amount) : 0;
  const officialFeesNative = officialFeeAmount ? parseFloat(officialFeeAmount) : 0;
  const officialFeesConverted = includeOfficialFees && officialFeesNative > 0
    ? convertCurrency(officialFeesNative, feeCurrency, currency)
    : 0;
  const coverFees = includeOfficialFees && coverFeeAmount ? parseFloat(coverFeeAmount) : 0;
  // alias for clarity in JSX — keeps coverFee always available when official fees included
  const showCoverFee = includeOfficialFees;
  const totalEstimate = professionalFees + officialFeesConverted + coverFees;

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Professional Fees ({symbol}) *
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
                htmlFor="installments"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Installments
              </label>
              <select
                id="installments"
                name="installments"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">Single payment</option>
                {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} installments
                  </option>
                ))}
              </select>
              {parseInt(installments) > 1 && amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {parseInt(installments)} payments of {symbol}
                  {(parseFloat(amount) / parseInt(installments)).toFixed(2)} each
                </p>
              )}
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

        {/* Official Patent Office Fees */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Official Patent Office Fees
            </h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="include_official_fees"
                value="true"
                checked={includeOfficialFees}
                onChange={(e) => setIncludeOfficialFees(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-sm text-slate-600">Include</span>
            </label>
          </div>

          {includeOfficialFees && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="official_fee_office"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Patent Office *
                  </label>
                  <select
                    id="official_fee_office"
                    name="official_fee_office"
                    value={feeOffice}
                    onChange={(e) => setFeeOffice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {OFFICE_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {PATENT_OFFICES[key].label}
                      </option>
                    ))}
                  </select>
                </div>

                {feeOffice === "WIPO" && (
                  <div>
                    <label
                      htmlFor="official_fee_sub_office"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Receiving Office *
                    </label>
                    <select
                      id="official_fee_sub_office"
                      name="official_fee_sub_office"
                      value={feeSubOffice}
                      onChange={(e) => setFeeSubOffice(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {WIPO_RECEIVING_OFFICES.map((key) => (
                        <option key={key} value={key}>
                          {PATENT_OFFICES[key].label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="official_fee_amount"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Official Fee Amount ({feeCurrencySymbol}{feeCurrency}) *
                  </label>
                  <input
                    id="official_fee_amount"
                    name="official_fee_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={officialFeeAmount}
                    onChange={(e) => setOfficialFeeAmount(e.target.value)}
                    placeholder={`e.g., 1000.00`}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {officialFeesNative > 0 && feeCurrency !== currency && (
                    <p className="text-xs text-slate-500 mt-1">
                      ≈ {symbol}{officialFeesConverted.toFixed(2)} {currency} (approximate)
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="cover_fee_amount"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    {isFxConversion ? "Currency Conversion Cover Fee" : "Service / Cover Fee"} ({symbol})
                  </label>
                  <input
                    id="cover_fee_amount"
                    name="cover_fee_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={coverFeeAmount}
                    onChange={(e) => setCoverFeeAmount(e.target.value)}
                    placeholder="e.g., 25.00"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {isFxConversion
                      ? "Covers FX margin + handling. + VAT where applicable."
                      : "Service charge for processing the official fee payment. + VAT where applicable."}
                  </p>
                </div>
              </div>

              {/* Hidden fields for form data */}
              <input type="hidden" name="official_fee_currency" value={feeCurrency} />
            </div>
          )}
        </div>

        {/* Summary */}
        {includeOfficialFees && professionalFees > 0 && officialFeesNative > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              Offer Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Professional Fees</span>
                <span className="text-navy font-medium">{symbol}{professionalFees.toFixed(2)} + VAT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Official Patent Office Fees — {feeOffice === "WIPO" ? `WIPO via ${PATENT_OFFICES[feeSubOffice]?.label?.split(" (")[0] || feeSubOffice}` : PATENT_OFFICES[feeOffice]?.label?.split(" (")[0] || feeOffice}
                </span>
                <span className="text-navy font-medium">
                  {feeCurrencySymbol}{officialFeesNative.toFixed(2)} {feeCurrency}
                  {feeCurrency !== currency && (
                    <span className="text-slate-400 ml-1">(≈ {symbol}{officialFeesConverted.toFixed(2)})</span>
                  )}
                </span>
              </div>
              {coverFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {isFxConversion ? "Currency Conversion Cover Fee" : "Service / Cover Fee"}
                  </span>
                  <span className="text-navy font-medium">{symbol}{coverFees.toFixed(2)} + VAT</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
                <span className="text-navy font-semibold">Estimated Total (excl. VAT)</span>
                <span className="text-navy font-bold text-lg">{symbol}{totalEstimate.toFixed(2)}</span>
              </div>
              <p className="text-xs text-blue-500 mt-1">
                Official fees are not subject to VAT. Professional fees and cover fee may attract VAT for UK clients.
              </p>
            </div>
          </div>
        )}

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
