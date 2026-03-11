import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://www.alexander-ip.com";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "\u00a3",
  EUR: "\u20ac",
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
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Offer token required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Look up the offer
    const { data: offer, error: lookupError } = await adminClient
      .from("offers")
      .select("*")
      .eq("token", token)
      .single();

    if (lookupError || !offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    // Check status
    if (offer.status !== "pending") {
      return NextResponse.json(
        { error: `This offer has already been ${offer.status}.` },
        { status: 400 }
      );
    }

    // Check expiry
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      // Lazy expiry — mark as expired
      await adminClient
        .from("offers")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", offer.id);

      return NextResponse.json(
        { error: "This offer has expired." },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const symbol = CURRENCY_SYMBOLS[offer.currency] || "$";
    const displayAmount = (offer.amount / 100).toFixed(2);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: offer.currency.toLowerCase(),
            product_data: {
              name: offer.title,
              description: offer.description || `Custom project — ${symbol}${displayAmount}`,
            },
            unit_amount: offer.amount,
            tax_behavior: "exclusive",
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${BASE_URL}/offer/${token}/success`,
      cancel_url: `${BASE_URL}/offer/${token}`,
      customer_email: offer.client_email,
      customer_creation: "always",
      billing_address_collection: "required",
      automatic_tax: { enabled: true },
      metadata: {
        offer_id: offer.id,
        offer_token: token,
        service: offer.service_type,
        source: "alexander-ip.com/offer",
        currency: offer.currency.toLowerCase(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Offer checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
