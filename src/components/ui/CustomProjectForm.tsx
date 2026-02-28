"use client";

import { useState, useEffect } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { getCurrencyFromBrowserLocale } from "@/lib/pricing";

const CURRENCY_CONFIG: Record<string, { symbol: string; code: string }> = {
  GBP: { symbol: "£", code: "gbp" },
  USD: { symbol: "$", code: "usd" },
  EUR: { symbol: "€", code: "eur" },
};

const SLIDER_MIN = 5; // display units (£5 / $5 / €5)
const SLIDER_MAX = 10000;
const SLIDER_DEFAULT = 500;

export default function CustomProjectForm() {
  const [amount, setAmount] = useState(SLIDER_DEFAULT);
  const [displayValue, setDisplayValue] = useState(
    SLIDER_DEFAULT.toFixed(2)
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencyKey, setCurrencyKey] = useState("GBP");

  useEffect(() => {
    setCurrencyKey(getCurrencyFromBrowserLocale());
  }, []);

  const { symbol, code } = CURRENCY_CONFIG[currencyKey] || CURRENCY_CONFIG.GBP;

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setAmount(val);
    setDisplayValue(val.toFixed(2));
    if (error) setError(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // Allow typing freely — only valid decimal patterns update the display
    if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
      setDisplayValue(val);
      if (val === "" || val === ".") {
        setAmount(0);
      } else {
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
          setAmount(Math.round(num * 100) / 100);
        }
      }
      if (error) setError(null);
    }
  }

  function handleInputBlur() {
    // Enforce minimum on blur and format with leading zero
    const finalAmount = amount < 0.5 ? 0.5 : amount;
    setAmount(finalAmount);
    setDisplayValue(finalAmount.toFixed(2));
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length <= 500) {
      setDescription(e.target.value);
      if (error) setError(null);
    }
  }

  // Slider position as percentage for the filled track
  const sliderPercent = Math.min(
    100,
    Math.max(
      0,
      ((Math.min(amount, SLIDER_MAX) - SLIDER_MIN) /
        (SLIDER_MAX - SLIDER_MIN)) *
        100
    )
  );

  async function handleCheckout() {
    if (amount < 0.5) {
      setError(`Minimum amount is ${symbol}0.50`);
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Please describe your project (at least 10 characters).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "custom",
          customAmount: Math.round(amount * 100), // convert to smallest unit
          description: description.trim(),
          currency: code,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-10">
        {/* Price selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-4">
            Payment amount
          </label>

          {/* Amount display */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl font-bold text-slate-400">{symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="text-5xl font-bold text-navy text-center w-56 bg-transparent border-none outline-none focus:ring-0"
              placeholder="0.00"
            />
          </div>

          {/* Slider */}
          <div className="relative px-1">
            <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all duration-75"
                style={{ width: `${sliderPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={5}
              value={Math.max(SLIDER_MIN, Math.min(amount, SLIDER_MAX))}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
            />
          </div>

          {/* Slider labels */}
          <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
            <span>
              {symbol}
              {SLIDER_MIN}
            </span>
            <span>
              {symbol}
              {(SLIDER_MAX / 2).toLocaleString()}
            </span>
            <span>
              {symbol}
              {SLIDER_MAX.toLocaleString()}
            </span>
          </div>

          {/* Hint for amounts below slider range */}
          <p className="text-center text-xs text-slate-400 mt-2">
            Use the slider or type any amount directly.
          </p>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label
            htmlFor="project-description"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Project description
          </label>
          <p className="text-sm text-slate-500 mb-3">
            Briefly describe the work you need — this helps us set up your
            project.
          </p>
          <textarea
            id="project-description"
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            maxLength={500}
            placeholder="e.g. Patent drafting for a solar panel mounting bracket, with UK and US filing..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-navy placeholder:text-slate-400 resize-none"
          />
          <p
            className={`text-xs mt-1 text-right ${description.length >= 480 ? "text-amber-500 font-medium" : "text-slate-400"}`}
          >
            {description.length} / 500
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={loading || amount < 0.5}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting to payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay {symbol}
              {amount >= 0.5
                ? amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-4">
          Secure payment via Stripe. +VAT where applicable.
        </p>
      </div>
    </div>
  );
}
