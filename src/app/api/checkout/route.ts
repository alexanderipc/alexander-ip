import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/* ──────────────────────────────────────────────────────────
   Multi-currency pricing
   Prices are rounded to the nearest 5 in each currency
   ────────────────────────────────────────────────────────── */

interface CurrencyPrice {
  currency: string;
  amount: number; // in smallest unit (cents / pence)
  symbol: string;
  display: string; // human-readable e.g. "$125"
}

const currencyPrices: Record<string, Record<string, CurrencyPrice>> = {
  consultation: {
    GBP: { currency: "gbp", amount: 9500, symbol: "£", display: "£95" },
    USD: { currency: "usd", amount: 12500, symbol: "$", display: "$125" },
    EUR: { currency: "eur", amount: 12000, symbol: "€", display: "€120" },
  },
};

// Fallback currency for unknown regions
const DEFAULT_CURRENCY = "USD";

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

function getCurrencyForCountry(countryCode: string | null): string {
  if (!countryCode) return DEFAULT_CURRENCY;
  return countryCurrencyMap[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}

/* ──────────────────────────────────────────────────────────
   Service config
   ────────────────────────────────────────────────────────── */

const serviceConfig: Record<string, { name: string; description: string }> = {
  consultation: {
    name: "Patent Consultation",
    description:
      "Expert patent consultation with Alexander Rowley. Covers patentability assessment, filing strategy, and all your questions — with a written summary to follow.",
  },
};

/* ──────────────────────────────────────────────────────────
   Checkout API
   ────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { service = "consultation" } = await request.json();

    const config = serviceConfig[service];
    if (!config) {
      return NextResponse.json(
        { error: "Invalid service type" },
        { status: 400 }
      );
    }

    // Detect country from Vercel geo headers
    const country = request.headers.get("x-vercel-ip-country");
    const currencyKey = getCurrencyForCountry(country);
    const prices = currencyPrices[service];
    const price = prices?.[currencyKey] || prices?.[DEFAULT_CURRENCY];

    if (!price) {
      return NextResponse.json(
        { error: "Pricing not available" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://alexander-ip.com";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: price.currency,
            product_data: {
              name: config.name,
              description: config.description,
            },
            unit_amount: price.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking/cancelled`,
      customer_creation: "always",
      billing_address_collection: "required",
      automatic_tax: { enabled: true },
      metadata: {
        service,
        source: "alexander-ip.com",
        detected_country: country || "unknown",
        currency: price.currency,
      },
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ──────────────────────────────────────────────────────────
   GET endpoint — returns the localised price for the visitor
   Used by the frontend to display the correct currency
   ────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const service =
    request.nextUrl.searchParams.get("service") || "consultation";
  const country = request.headers.get("x-vercel-ip-country");
  const currencyKey = getCurrencyForCountry(country);
  const prices = currencyPrices[service];
  const price = prices?.[currencyKey] || prices?.[DEFAULT_CURRENCY];

  return NextResponse.json({
    currency: price?.currency || "usd",
    display: price?.display || "$125",
    symbol: price?.symbol || "$",
    amount: price?.amount || 12500,
    country: country || "unknown",
  });
}
