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
    GBP: { currency: "gbp", amount: 8500, symbol: "£", display: "£85" },
    USD: { currency: "usd", amount: 11200, symbol: "$", display: "$112" },
    EUR: { currency: "eur", amount: 10800, symbol: "€", display: "€108" },
  },
  /* Patent Search tiers */
  "patent-search-basic": {
    GBP: { currency: "gbp", amount: 22500, symbol: "£", display: "£225" },
    USD: { currency: "usd", amount: 30000, symbol: "$", display: "$300" },
    EUR: { currency: "eur", amount: 28800, symbol: "€", display: "€288" },
  },
  "patent-search-standard": {
    GBP: { currency: "gbp", amount: 25000, symbol: "£", display: "£250" },
    USD: { currency: "usd", amount: 34000, symbol: "$", display: "$340" },
    EUR: { currency: "eur", amount: 32500, symbol: "€", display: "€325" },
  },
  "patent-search-premium": {
    GBP: { currency: "gbp", amount: 32500, symbol: "£", display: "£325" },
    USD: { currency: "usd", amount: 43500, symbol: "$", display: "$435" },
    EUR: { currency: "eur", amount: 42000, symbol: "€", display: "€420" },
  },
  /* Patent Drafting tiers */
  "patent-drafting-simple": {
    GBP: { currency: "gbp", amount: 66000, symbol: "£", display: "£660" },
    USD: { currency: "usd", amount: 89500, symbol: "$", display: "$895" },
    EUR: { currency: "eur", amount: 86000, symbol: "€", display: "€860" },
  },
  "patent-drafting-mid": {
    GBP: { currency: "gbp", amount: 79500, symbol: "£", display: "£795" },
    USD: { currency: "usd", amount: 107500, symbol: "$", display: "$1,075" },
    EUR: { currency: "eur", amount: 103500, symbol: "€", display: "€1,035" },
  },
  "patent-drafting-complex": {
    GBP: { currency: "gbp", amount: 92500, symbol: "£", display: "£925" },
    USD: { currency: "usd", amount: 125500, symbol: "$", display: "$1,255" },
    EUR: { currency: "eur", amount: 120500, symbol: "€", display: "€1,205" },
  },
  /* FTO / Infringement Check tiers */
  "fto-landscape": {
    GBP: { currency: "gbp", amount: 40000, symbol: "£", display: "£400" },
    USD: { currency: "usd", amount: 54000, symbol: "$", display: "$540" },
    EUR: { currency: "eur", amount: 52000, symbol: "€", display: "€520" },
  },
  "fto-simple": {
    GBP: { currency: "gbp", amount: 106500, symbol: "£", display: "£1,065" },
    USD: { currency: "usd", amount: 144000, symbol: "$", display: "$1,440" },
    EUR: { currency: "eur", amount: 138000, symbol: "€", display: "€1,380" },
  },
  "fto-complex": {
    GBP: { currency: "gbp", amount: 166500, symbol: "£", display: "£1,665" },
    USD: { currency: "usd", amount: 225000, symbol: "$", display: "$2,250" },
    EUR: { currency: "eur", amount: 216000, symbol: "€", display: "€2,160" },
  },
};

export const DEFAULT_CURRENCY = "USD";

/* ── Patent office fee config ─────────────────────────────── */

export interface PatentOffice {
  label: string;
  currency: string | null; // null for WIPO (depends on receiving office)
  symbol: string | null;
}

export const PATENT_OFFICES: Record<string, PatentOffice> = {
  EPO: { label: "EPO (European Patent Office)", currency: "EUR", symbol: "€" },
  UKIPO: { label: "UKIPO (UK IPO)", currency: "GBP", symbol: "£" },
  USPTO: { label: "USPTO (US Patent Office)", currency: "USD", symbol: "$" },
  CIPO: { label: "CIPO (Canadian IP Office)", currency: "CAD", symbol: "CA$" },
  AU_IPO: { label: "AU IPO (IP Australia)", currency: "AUD", symbol: "A$" },
  WIPO: { label: "WIPO (World IP Organization)", currency: null, symbol: null },
};

/** Offices that can serve as WIPO receiving offices */
export const WIPO_RECEIVING_OFFICES = ["EPO", "UKIPO", "USPTO", "CIPO", "AU_IPO"] as const;

/** Get the effective currency for an office (resolving WIPO via sub-office) */
export function getOfficeCurrency(
  office: string,
  subOffice?: string | null
): { currency: string; symbol: string } {
  if (office === "WIPO" && subOffice) {
    const sub = PATENT_OFFICES[subOffice];
    if (sub?.currency && sub?.symbol) return { currency: sub.currency, symbol: sub.symbol };
  }
  const o = PATENT_OFFICES[office];
  if (o?.currency && o?.symbol) return { currency: o.currency, symbol: o.symbol };
  return { currency: "GBP", symbol: "£" }; // fallback
}

/** Get the office label including sub-office for WIPO */
export function getOfficeLabel(office: string, subOffice?: string | null): string {
  if (office === "WIPO" && subOffice) {
    const sub = PATENT_OFFICES[subOffice];
    return `WIPO via ${sub?.label || subOffice}`;
  }
  return PATENT_OFFICES[office]?.label || office;
}

/* ── Exchange rates (update periodically) ───────────────── */
/** Rates relative to USD (1 USD = X of target currency) */
const rates: Record<string, number> = {
  GBP: 0.74,
  EUR: 0.96,
  USD: 1,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
};

const symbols: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF ",
};

/**
 * Convert an amount from one currency to another using stored rates.
 * Both amounts in major units (e.g. 100.00 EUR → ~78.00 GBP).
 * Returns amount in major units.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  // Convert to USD first, then to target
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

/**
 * Convert an amount in smallest units from one currency to another.
 * Returns amount in smallest units of target currency.
 */
export function convertCurrencySmallest(
  amountSmallest: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amountSmallest;
  const major = amountSmallest / 100;
  const converted = convertCurrency(major, fromCurrency, toCurrency);
  return Math.round(converted * 100);
}

export function getCurrencySymbol(currency: string): string {
  return symbols[currency] || currency + " ";
}

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
  if (amount < 5000) return Math.round(amount / 5) * 5;
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
  return price?.display || "$112";
}
