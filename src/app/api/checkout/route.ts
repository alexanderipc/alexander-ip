import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in .env.local" },
        { status: 500 }
      );
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const { priceId, serviceType } = await request.json();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceType || "Patent Consultation",
              description:
                "Expert patent law and strategy consultation with Alexander Rowley",
            },
            unit_amount: 12500, // $125.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://alexander-ip.com"}/services/consultation?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://alexander-ip.com"}/services/consultation?cancelled=true`,
      customer_email: undefined, // Will be collected by Stripe
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
