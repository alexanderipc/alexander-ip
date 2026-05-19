import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOfficeLabel,
  convertCurrencySmallest,
} from "@/lib/pricing";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const BASE_URL = "https://www.alexander-ip.com";
const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "\u00a3",
  EUR: "\u20ac",
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (limiter.isLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

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

    // Installment calculations
    const totalInstallments = offer.installments || 1;
    const paidInstallments = offer.installments_paid || 0;
    const isInstallmentPlan = totalInstallments > 1;

    // Safety: all installments already paid?
    if (paidInstallments >= totalInstallments) {
      return NextResponse.json(
        { error: "All installments have already been paid." },
        { status: 400 }
      );
    }

    const nextInstallment = paidInstallments + 1;

    // Check expiry — only before first payment
    if (
      paidInstallments === 0 &&
      offer.expires_at &&
      new Date(offer.expires_at) < new Date()
    ) {
      await adminClient
        .from("offers")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", offer.id);

      return NextResponse.json(
        { error: "This offer has expired." },
        { status: 400 }
      );
    }

    // ── Build line items ──
    const hasOfficialFees = offer.include_official_fees &&
      offer.official_fee_amount &&
      offer.official_fee_currency;

    // Compute professional fee amount to charge
    let professionalChargeAmount: number;
    let productName: string;
    let productDescription: string;

    if (isInstallmentPlan) {
      const perInstallment = Math.ceil(offer.amount / totalInstallments);
      const lastInstallment = offer.amount - perInstallment * (totalInstallments - 1);
      professionalChargeAmount = nextInstallment === totalInstallments ? lastInstallment : perInstallment;
      productName = `${offer.title} \u2014 Installment ${nextInstallment} of ${totalInstallments}`;
      const symbol = CURRENCY_SYMBOLS[offer.currency] || "$";
      productDescription = `Installment ${nextInstallment} of ${totalInstallments} \u2014 ${symbol}${(professionalChargeAmount / 100).toFixed(2)}`;
    } else {
      professionalChargeAmount = offer.amount;
      productName = offer.title;
      const symbol = CURRENCY_SYMBOLS[offer.currency] || "$";
      productDescription = offer.description || `Custom project \u2014 ${symbol}${(offer.amount / 100).toFixed(2)}`;
    }

    // Line item 1: Professional fees (VAT applies)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: offer.currency.toLowerCase(),
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: professionalChargeAmount,
          tax_behavior: "exclusive",
        },
        quantity: 1,
      },
    ];

    // Line item 2: Official Patent Office Fees (no VAT)
    if (hasOfficialFees) {
      const officeLabel = getOfficeLabel(
        offer.official_fee_office,
        offer.official_fee_sub_office
      );

      // Convert fee from native currency to offer currency for Stripe
      const officialFeeInOfferCurrency = convertCurrencySmallest(
        offer.official_fee_amount,
        offer.official_fee_currency,
        offer.currency
      );

      lineItems.push({
        price_data: {
          currency: offer.currency.toLowerCase(),
          product_data: {
            name: `Official Patent Office Fees \u2014 ${officeLabel} (Handling As Agent)`,
          },
          unit_amount: officialFeeInOfferCurrency,
          tax_behavior: "inclusive",
        },
        quantity: 1,
      });

      // Line item 3: Currency Conversion Cover Fee (VAT applies)
      if (offer.cover_fee_amount && offer.cover_fee_amount > 0) {
        lineItems.push({
          price_data: {
            currency: offer.currency.toLowerCase(),
            product_data: {
              name: "Currency Conversion Cover Fee",
            },
            unit_amount: offer.cover_fee_amount,
            tax_behavior: "exclusive",
          },
          quantity: 1,
        });
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: isInstallmentPlan
        ? `${BASE_URL}/offer/${token}/success?session_id={CHECKOUT_SESSION_ID}&installment=${nextInstallment}&total=${totalInstallments}&token=${token}`
        : `${BASE_URL}/offer/${token}/success?session_id={CHECKOUT_SESSION_ID}`,
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
        ...(hasOfficialFees && {
          has_official_fees: "true",
          official_fee_office: offer.official_fee_office,
          official_fee_sub_office: offer.official_fee_sub_office || "",
          official_fee_currency: offer.official_fee_currency,
          official_fee_amount: String(offer.official_fee_amount),
          cover_fee_amount: String(offer.cover_fee_amount || 0),
        }),
        ...(isInstallmentPlan && {
          installment_number: String(nextInstallment),
          total_installments: String(totalInstallments),
        }),
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
