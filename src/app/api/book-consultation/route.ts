import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateSlot,
  PAID_CONSULTATION_DURATION_MINUTES,
} from "@/lib/booking/availability";
import {
  currencyPrices,
  getCurrencyForCountry,
  DEFAULT_CURRENCY,
} from "@/lib/pricing";
import { sendCheckoutErrorAlert } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE_URL = "https://www.alexander-ip.com";
const HOLD_MINUTES = 30; // pending booking expires after this if no payment

const STAGE_VALUES = ["idea", "prototype", "filed", "unsure"] as const;
type Stage = (typeof STAGE_VALUES)[number];
const STAGE_LABELS: Record<Stage, string> = {
  idea: "Just an idea",
  prototype: "Built a prototype / proof of concept",
  filed: "Already filed something",
  unsure: "Not sure",
};

interface BookConsultationRequest {
  email?: string;
  name?: string;
  stage?: string;
  topic?: string;
  startUtc?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment is temporarily unavailable. Please try again shortly." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as BookConsultationRequest;

    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const topicRaw = (body.topic || "").trim();
    const topic = topicRaw ? topicRaw.slice(0, 1000) : null;
    const startUtcIso = body.startUtc || "";
    const stage =
      body.stage && (STAGE_VALUES as readonly string[]).includes(body.stage)
        ? (body.stage as Stage)
        : null;

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!stage) {
      return NextResponse.json(
        { error: "Please tell me where you're at with this." },
        { status: 400 }
      );
    }
    if (!startUtcIso) {
      return NextResponse.json({ error: "Please pick a slot." }, { status: 400 });
    }

    const slotError = validateSlot(
      startUtcIso,
      new Date(),
      PAID_CONSULTATION_DURATION_MINUTES
    );
    if (slotError) {
      return NextResponse.json({ error: slotError }, { status: 400 });
    }

    const startUtc = new Date(startUtcIso);
    const endUtc = new Date(
      startUtc.getTime() + PAID_CONSULTATION_DURATION_MINUTES * 60 * 1000
    );
    const adminClient = createAdminClient();
    const now = new Date();

    /* Race-condition guard: re-check both booking tables for any overlapping
       slot that's currently active (paid OR pending-still-held OR free-call). */
    const [
      { data: paidClash },
      { data: pendingClash },
      { data: freeClash },
    ] = await Promise.all([
      adminClient
        .from("paid_consultation_bookings")
        .select("id, scheduled_at, duration_minutes")
        .eq("status", "paid")
        .gte("scheduled_at", new Date(startUtc.getTime() - 60 * 60 * 1000).toISOString())
        .lt("scheduled_at", endUtc.toISOString()),
      adminClient
        .from("paid_consultation_bookings")
        .select("id, scheduled_at, duration_minutes, pending_until")
        .eq("status", "pending")
        .gt("pending_until", now.toISOString())
        .gte("scheduled_at", new Date(startUtc.getTime() - 60 * 60 * 1000).toISOString())
        .lt("scheduled_at", endUtc.toISOString()),
      adminClient
        .from("lead_call_bookings")
        .select("id, scheduled_at, duration_minutes")
        .eq("status", "booked")
        .gte("scheduled_at", new Date(startUtc.getTime() - 60 * 60 * 1000).toISOString())
        .lt("scheduled_at", endUtc.toISOString()),
    ]);

    const hasOverlap = (
      rows: { scheduled_at: string; duration_minutes?: number | null }[] | null
    ) =>
      (rows ?? []).some((r) => {
        const rs = new Date(r.scheduled_at).getTime();
        const re = rs + (r.duration_minutes ?? 60) * 60 * 1000;
        return rs < endUtc.getTime() && re > startUtc.getTime();
      });

    if (hasOverlap(paidClash) || hasOverlap(pendingClash) || hasOverlap(freeClash)) {
      return NextResponse.json(
        { error: "Sorry — that time has just been taken. Please pick another." },
        { status: 409 }
      );
    }

    /* Currency / pricing — same logic the existing /api/checkout uses. */
    const country = request.headers.get("x-vercel-ip-country");
    const currencyKey = getCurrencyForCountry(country);
    const prices = currencyPrices.consultation;
    const price = prices?.[currencyKey] || prices?.[DEFAULT_CURRENCY];
    if (!price) {
      return NextResponse.json(
        { error: "Pricing unavailable. Please try again." },
        { status: 500 }
      );
    }

    /* Insert the pending booking row. The unique index on
       (scheduled_at) WHERE status='paid' won't fire here — but a concurrent
       paid row would already have been caught by the overlap check above. */
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const pendingUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    const { data: inserted, error: insertError } = await adminClient
      .from("paid_consultation_bookings")
      .insert({
        lead_email: email,
        lead_name: name,
        stage,
        topic,
        scheduled_at: startUtc.toISOString(),
        duration_minutes: PAID_CONSULTATION_DURATION_MINUTES,
        status: "pending",
        pending_until: pendingUntil.toISOString(),
        amount_minor: price.amount,
        currency: price.currency,
        ip_address: ipAddress,
        user_agent: request.headers.get("user-agent") || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[book-consultation] insert failed:", insertError);
      return NextResponse.json(
        { error: "Couldn't reserve the slot. Please try again." },
        { status: 500 }
      );
    }

    /* Create the Stripe Checkout session. We re-use the standard consultation
       service config so the existing webhook still creates a project on
       payment — and add a `consultation_booking_id` so the webhook also marks
       this booking as paid + creates a Google event. */
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const stageLabel = stage ? STAGE_LABELS[stage] : null;
    const productDescription = `1-hour patent consultation with Alexander Rowley on ${new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Europe/London",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(startUtc)} UK.`;

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: price.currency,
              product_data: {
                name: `Patent Consultation (${price.currency.toUpperCase()})`,
                description: productDescription,
              },
              unit_amount: price.amount,
              tax_behavior: "exclusive",
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/booking/cancelled?service=consultation&booking=${encodeURIComponent(
          inserted.id
        )}`,
        customer_email: email,
        customer_creation: "always",
        billing_address_collection: "required",
        automatic_tax: { enabled: true },
        // Hold expires shortly after our pending_until so Stripe matches.
        expires_at:
          Math.floor(pendingUntil.getTime() / 1000) + 5 * 60, // 5min grace
        metadata: {
          service: "consultation",
          consultation_booking_id: inserted.id,
          consultation_scheduled_at: startUtc.toISOString(),
          consultation_stage: stage,
          source: "alexander-ip.com",
          detected_country: country || "unknown",
          currency: price.currency,
        },
      });
    } catch (err) {
      console.error("[book-consultation] Stripe session create failed:", err);
      // Best-effort: mark the row expired so the slot reopens.
      await adminClient
        .from("paid_consultation_bookings")
        .update({ status: "expired" })
        .eq("id", inserted.id);
      const errorMessage = err instanceof Error ? err.message : String(err);
      void sendCheckoutErrorAlert({
        service: "consultation",
        customAmount: null,
        currency: price.currency,
        description: `slot ${startUtcIso}`,
        errorMessage,
        detectedCountry: country,
        userAgent: request.headers.get("user-agent"),
      });
      return NextResponse.json(
        { error: "Couldn't start payment. Please try again." },
        { status: 500 }
      );
    }

    /* Persist the Stripe session id so the webhook can find this booking. */
    await adminClient
      .from("paid_consultation_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", inserted.id);

    return NextResponse.json({
      success: true,
      bookingId: inserted.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Book-consultation error:", err);
    return NextResponse.json(
      { error: "Couldn't book the consultation. Please try again." },
      { status: 500 }
    );
  }
}
