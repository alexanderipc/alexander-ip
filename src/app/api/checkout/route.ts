import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  currencyPrices,
  getCurrencyForCountry,
  DEFAULT_CURRENCY,
} from "@/lib/pricing";

const serviceConfig: Record<string, { name: string; description: string }> = {
  consultation: {
    name: "Patent Consultation",
    description:
      "Expert patent consultation with Alexander Rowley. Covers patentability assessment, filing strategy, and all your questions — with a written summary to follow.",
  },
  /* Patent Search tiers */
  "patent-search-basic": {
    name: "Patent Search — Basic",
    description:
      "Prior art search of published patents relevant to your invention, with a detailed patentability report and opinion.",
  },
  "patent-search-standard": {
    name: "Patent Search — Standard",
    description:
      "Expanded prior art search including web disclosures and non-patent literature, with a detailed patentability report.",
  },
  "patent-search-premium": {
    name: "Patent Search — Premium",
    description:
      "Comprehensive prior art search with a live strategy call to discuss findings and plan the best path forward.",
  },
  /* Patent Drafting tiers */
  "patent-drafting-simple": {
    name: "Patent Drafting — Simple Invention",
    description:
      "Complete patent application for a mechanical invention with few moving parts. Includes background, claims, abstract, and one round of revisions.",
  },
  "patent-drafting-mid": {
    name: "Patent Drafting — Mid-Tier Invention",
    description:
      "Complete patent application for an electrical/electronic system of moderate complexity. Includes background, claims, abstract, and one round of revisions.",
  },
  "patent-drafting-complex": {
    name: "Patent Drafting — Complex Invention",
    description:
      "Complete patent application for software, AI, biochemistry, or advanced systems. Includes background, claims, abstract, and one round of revisions.",
  },
  /* FTO / Infringement Check tiers */
  "fto-landscape": {
    name: "FTO — Patent Landscape",
    description:
      "Research and report identifying high-risk active patents and summarising the field, with a 60-minute consultation. 30-day delivery.",
  },
  "fto-simple": {
    name: "FTO — Simple Invention",
    description:
      "Full freedom-to-operate search and report with detailed claims analysis for straightforward products. 45-day delivery.",
  },
  "fto-complex": {
    name: "FTO — Complex Invention",
    description:
      "Full freedom-to-operate search and report with detailed claims analysis for complex, multi-technology products. 45-day delivery.",
  },
  /* Custom project — client sets their own quoted price */
  custom: {
    name: "Custom Project",
    description: "Custom IP project at a pre-agreed price.",
  },
};

/* Currency symbols for custom amount display */
const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

/* Hardcoded base URL — avoids any env var issues */
const BASE_URL = "https://www.alexander-ip.com";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.json();
    const { service = "consultation", customAmount, description, currency: bodyCurrency } = body;

    const config = serviceConfig[service];
    if (!config) {
      return NextResponse.json(
        { error: "Invalid service type" },
        { status: 400 }
      );
    }

    const country = request.headers.get("x-vercel-ip-country");
    const currencyKey = getCurrencyForCountry(country);

    let unitAmount: number;
    let currency: string;
    let productName: string;
    let productDescription: string;

    if (service === "custom") {
      // Custom project: client provides the amount
      if (!customAmount || typeof customAmount !== "number" || customAmount < 50) {
        return NextResponse.json(
          { error: "Invalid amount. Minimum is 0.50." },
          { status: 400 }
        );
      }

      unitAmount = Math.round(customAmount);
      // Use client-specified currency if valid, otherwise fall back to country detection
      const validCurrencies = ["gbp", "usd", "eur"];
      currency = bodyCurrency && validCurrencies.includes(String(bodyCurrency).toLowerCase())
        ? String(bodyCurrency).toLowerCase()
        : currencyKey.toLowerCase();
      const symbol = CURRENCY_SYMBOLS[currency] || "$";
      const displayAmount = (unitAmount / 100).toFixed(2);
      productName = `Custom Project — ${symbol}${displayAmount}`;
      productDescription = description
        ? String(description).slice(0, 500)
        : "Custom IP project at a pre-agreed price.";
    } else {
      // Standard service: use hardcoded pricing
      const prices = currencyPrices[service];
      const price = prices?.[currencyKey] || prices?.[DEFAULT_CURRENCY];

      if (!price) {
        return NextResponse.json(
          { error: "Pricing not available" },
          { status: 500 }
        );
      }

      unitAmount = price.amount;
      currency = price.currency;
      productName = config.name;
      productDescription = config.description;
    }

    const successUrl = `${BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${BASE_URL}/booking/cancelled?service=${encodeURIComponent(service)}`;

    const metadata: Record<string, string> = {
      service,
      source: "alexander-ip.com",
      detected_country: country || "unknown",
      currency,
    };

    // Store description in metadata for custom projects (webhook uses this)
    if (service === "custom" && description) {
      metadata.description = String(description).slice(0, 500);
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: unitAmount,
            tax_behavior: "exclusive",
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_creation: "always",
      billing_address_collection: "required",
      automatic_tax: { enabled: true },
      metadata,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);

    // Extract detailed Stripe error info
    let message = "Failed to create checkout session";
    let code = "unknown";
    let param = "";
    if (error instanceof Stripe.errors.StripeError) {
      message = error.message;
      code = error.code || error.type || "stripe_error";
      param = (error as Stripe.errors.StripeInvalidRequestError).param || "";
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      { error: message, code, param },
      { status: 500 }
    );
  }
}
