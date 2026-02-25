/* ──────────────────────────────────────────────────────────
   Shared pricing & currency conversion
   ────────────────────────────────────────────────────────── */

export interface CurrencyPrice {
  currency: string;
  amount: number; // in smallest unit (cents / pence)
  symbol: string;
  display: string;
}

/* Fixed consultation prices (used by Stripe checkout) */
export const currencyPrices: Record<string, Record<string, CurrencyPrice>> = {
  consultation: {
    GBP: { currency: "gbp", amount: 9500, symbol: "£", display: "£95" },
    USD: { currency: "usd", amount: 12500, symbol: "$", display: "$125" },
    EUR: { currency: "eur", amount: 12000, symbol: "€", display: "€120" },
  },
};

export const DEFAULT_CURRENCY = "USD";

/* ── Exchange rates (update periodically) ───────────────── */
const rates: Record<string, number> = {
  GBP: 0.74,
  EUR: 0.96,
  USD: 1,
};

const symbols: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

/* ── Country → currency mapping ─────────────────────────── */
const countryCurrencyMap: Record<string, string> = {
  GB: "GBP",
  AT: "EUR", BE: "EUR", CY: "EUR", EE: "EUR", FI: "EUR",
  FR: "EUR", DE: "EUR", GR: "EUR", IE: "EUR", IT: "EUR",
  LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR", NL: "EUR",
  PT: "EUR", SK: "EUR", SI: "EUR", ES: "EUR", HR: "EUR",
  US: "USD", PR: "USD", GU: "USD", VI: "USD", AS: "USD",
};

export function getCurrencyForCountry(countryCode: string | null): string {
  if (!countryCode) return DEFAULT_CURRENCY;
  return countryCurrencyMap[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}

/* ── Browser locale detection (client-side) ─────────────── */
export function getCurrencyFromBrowserLocale(): string {
  if (typeof navigator === "undefined") return DEFAULT_CURRENCY;

  const lang = navigator.language || "";
  const parts = lang.split("-");
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase();
    const currency = countryCurrencyMap[region];
    if (currency) return currency;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Europe/London") || tz === "GB") return "GBP";
    if (
      tz.startsWith("Europe/") &&
      !tz.startsWith("Europe/London") &&
      !tz.startsWith("Europe/Istanbul")
    )
      return "EUR";
    if (tz.startsWith("America/")) return "USD";
  } catch {
    // Intl not available
  }

  return DEFAULT_CURRENCY;
}

/* ── Universal price conversion ─────────────────────────── */

/** Round to a "clean" number in the target currency */
function roundToNice(amount: number): number {
  if (amount < 100) return Math.round(amount / 5) * 5;
  if (amount < 1000) return Math.round(amount / 5) * 5;
  if (amount < 5000) return Math.round(amount / 25) * 25;
  return Math.round(amount / 500) * 500;
}

/** Convert a USD dollar amount to localised display string */
export function convertPrice(usdAmount: number, currency: string): string {
  const rate = rates[currency] || 1;
  const symbol = symbols[currency] || "$";
  const converted = usdAmount * rate;
  const rounded = currency === "USD" ? usdAmount : roundToNice(converted);
  return `${symbol}${rounded.toLocaleString("en-US")}`;
}

/** Convert a USD range to localised display string */
export function convertRange(
  usdFrom: number,
  usdTo: number,
  currency: string
): string {
  const rate = rates[currency] || 1;
  const symbol = symbols[currency] || "$";
  const from = currency === "USD" ? usdFrom : roundToNice(usdFrom * rate);
  const to = currency === "USD" ? usdTo : roundToNice(usdTo * rate);
  return `${symbol}${from.toLocaleString("en-US")}\u2013${symbol}${to.toLocaleString("en-US")}`;
}

/** Get the pre-set display price for a checkout service */
export function getDisplayPrice(service: string, currencyKey: string): string {
  const prices = currencyPrices[service];
  const price = prices?.[currencyKey] || prices?.[DEFAULT_CURRENCY];
  return price?.display || "$125";
}
