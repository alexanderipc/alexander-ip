/* ──────────────────────────────────────────────────────────
   Shared pricing & currency conversion
   ────────────────────────────────────────────────────────── */

export interface CurrencyPrice {
  currency: string;
  amount: number; // in smallest unit (cents / pence)
  symbol: string;
  display: string;
}

/* Fixed prices per service tier (used by Stripe checkout) */
export const currencyPrices: Record<string, Record<string, CurrencyPrice>> = {
  consultation: {
    GBP: { currency: "gbp", amount: 9500, symbol: "£", display: "£95" },
    USD: { currency: "usd", amount: 12500, symbol: "$", display: "$125" },
    EUR: { currency: "eur", amount: 12000, symbol: "€", display: "€120" },
  },
  /* Patent Search tiers */
  "patent-search-basic": {
    GBP: { currency: "gbp", amount: 25000, symbol: "£", display: "£250" },
    USD: { currency: "usd", amount: 33500, symbol: "$", display: "$335" },
    EUR: { currency: "eur", amount: 32000, symbol: "€", display: "€320" },
  },
  "patent-search-standard": {
    GBP: { currency: "gbp", amount: 28000, symbol: "£", display: "£280" },
    USD: { currency: "usd", amount: 37500, symbol: "$", display: "$375" },
    EUR: { currency: "eur", amount: 36000, symbol: "€", display: "€360" },
  },
  "patent-search-premium": {
    GBP: { currency: "gbp", amount: 36000, symbol: "£", display: "£360" },
    USD: { currency: "usd", amount: 48500, symbol: "$", display: "$485" },
    EUR: { currency: "eur", amount: 46500, symbol: "€", display: "€465" },
  },
  /* Patent Drafting tiers */
  "patent-drafting-simple": {
    GBP: { currency: "gbp", amount: 73500, symbol: "£", display: "£735" },
    USD: { currency: "usd", amount: 99500, symbol: "$", display: "$995" },
    EUR: { currency: "eur", amount: 95500, symbol: "€", display: "€955" },
  },
  "patent-drafting-mid": {
    GBP: { currency: "gbp", amount: 88500, symbol: "£", display: "£885" },
    USD: { currency: "usd", amount: 119500, symbol: "$", display: "$1,195" },
    EUR: { currency: "eur", amount: 115000, symbol: "€", display: "€1,150" },
  },
  "patent-drafting-complex": {
    GBP: { currency: "gbp", amount: 103000, symbol: "£", display: "£1,030" },
    USD: { currency: "usd", amount: 139500, symbol: "$", display: "$1,395" },
    EUR: { currency: "eur", amount: 134000, symbol: "€", display: "€1,340" },
  },
  /* FTO / Infringement Check tiers */
  "fto-landscape": {
    GBP: { currency: "gbp", amount: 44500, symbol: "£", display: "£445" },
    USD: { currency: "usd", amount: 60000, symbol: "$", display: "$600" },
    EUR: { currency: "eur", amount: 57500, symbol: "€", display: "€575" },
  },
  "fto-simple": {
    GBP: { currency: "gbp", amount: 118500, symbol: "£", display: "£1,185" },
    USD: { currency: "usd", amount: 160000, symbol: "$", display: "$1,600" },
    EUR: { currency: "eur", amount: 153500, symbol: "€", display: "€1,535" },
  },
  "fto-complex": {
    GBP: { currency: "gbp", amount: 185000, symbol: "£", display: "£1,850" },
    USD: { currency: "usd", amount: 250000, symbol: "$", display: "$2,500" },
    EUR: { currency: "eur", amount: 240000, symbol: "€", display: "€2,400" },
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
