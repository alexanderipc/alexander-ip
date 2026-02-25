import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Service price map (amounts in cents USD)
const servicePrices: Record<
  string,
  { amount: number; name: string; description: string }
> = {
  consultation: {
    amount: 12500,
    name: "Patent Consultation",
    description:
      "Expert patent consultation with Alexander Rowley. Covers patentability assessment, filing strategy, and all your questions — with a written summary to follow.",
  },
};

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

    const serviceConfig = servicePrices[service];
    if (!serviceConfig) {
      return NextResponse.json(
        { error: "Invalid service type" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://alexander-ip.com";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceConfig.name,
              description: serviceConfig.description,
            },
            unit_amount: serviceConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking/cancelled`,
      // Collect customer email for follow-up
      customer_creation: "always",
      // Collect billing address to determine tax jurisdiction
      billing_address_collection: "required",
      // Enable automatic tax (handles UK VAT at 20% for UK customers)
      automatic_tax: { enabled: true },
      // Add metadata for Xero reconciliation
      metadata: {
        service,
        source: "alexander-ip.com",
      },
      // Allow promo codes if you set them up later
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    // Return a useful error message in development
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
