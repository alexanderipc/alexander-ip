/* ──────────────────────────────────────────────────────────
   Shared pricing data & locale detection
   Used by both the checkout API (server) and LocalizedPrice (client)
   ────────────────────────────────────────────────────────── */

export interface CurrencyPrice {
  currency: string;
  amount: number; // in smallest unit (cents / pence)
  symbol: string;
  display: string; // human-readable e.g. "$125"
}

export const currencyPrices: Record<string, Record<string, CurrencyPrice>> = {
  consultation: {
    GBP: { currency: "gbp", amount: 9500, symbol: "£", display: "£95" },
    USD: { currency: "usd", amount: 12500, symbol: "$", display: "$125" },
    EUR: { currency: "eur", amount: 12000, symbol: "€", display: "€120" },
  },
};

export const DEFAULT_CURRENCY = "USD";

// Map ISO 3166-1 alpha-2 country codes → currency
const countryCurrencyMap: Record<string, string> = {
  // GBP
  GB: "GBP",
  // EUR (Eurozone + common EU)
  AT: "EUR", BE: "EUR", CY: "EUR", EE: "EUR", FI: "EUR",
  FR: "EUR", DE: "EUR", GR: "EUR", IE: "EUR", IT: "EUR",
  LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR", NL: "EUR",
  PT: "EUR", SK: "EUR", SI: "EUR", ES: "EUR", HR: "EUR",
  // USD (US and territories)
  US: "USD", PR: "USD", GU: "USD", VI: "USD", AS: "USD",
};

// Map browser locale region codes → currency
// navigator.language returns e.g. "en-GB", "de-DE", "en-US"
const localeRegionMap: Record<string, string> = {
  ...countryCurrencyMap,
};

export function getCurrencyForCountry(countryCode: string | null): string {
  if (!countryCode) return DEFAULT_CURRENCY;
  return countryCurrencyMap[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}

/**
 * Detect currency from browser locale (client-side only).
 * Uses navigator.language and Intl to determine the user's region.
 */
export function getCurrencyFromBrowserLocale(): string {
  if (typeof navigator === "undefined") return DEFAULT_CURRENCY;

  // Try navigator.language first — e.g. "en-GB", "de-DE"
  const lang = navigator.language || "";
  const parts = lang.split("-");
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase();
    const currency = localeRegionMap[region];
    if (currency) return currency;
  }

  // Try Intl timezone as backup — e.g. "Europe/London" → GB
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Europe/London") || tz.startsWith("GB")) return "GBP";
    if (
      tz.startsWith("Europe/") &&
      !tz.startsWith("Europe/London") &&
      !tz.startsWith("Europe/Istanbul")
    ) {
      return "EUR";
    }
    if (tz.startsWith("America/")) return "USD";
  } catch {
    // Intl not available
  }

  return DEFAULT_CURRENCY;
}

/** Get the display price for a service in a given currency */
export function getDisplayPrice(
  service: string,
  currencyKey: string
): string {
  const prices = currencyPrices[service];
  const price = prices?.[currencyKey] || prices?.[DEFAULT_CURRENCY];
  return price?.display || "$125";
}
