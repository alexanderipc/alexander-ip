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
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
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

    const session = await stripe.checkout.sessions.create({
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
      metadata: {
        service,
        source: "alexander-ip.com",
        detected_country: country || "unknown",
        currency: price.currency,
      },
      allow_promotion_codes: true,
    });

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
