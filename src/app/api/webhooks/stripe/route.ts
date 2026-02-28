import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIMELINES,
  calculateDeliveryDate,
} from "@/lib/portal/status";
import { sendProjectCreatedEmail } from "@/lib/email";
import type { ServiceType } from "@/lib/supabase/types";

export const runtime = "nodejs";

/* ── Service mapping ─────────────────────────────────────────── */

interface ServiceMapping {
  serviceType: ServiceType;
  title: string;
}

const SERVICE_MAP: Record<string, ServiceMapping> = {
  consultation: {
    serviceType: "consultation",
    title: "Patent Consultation",
  },
  "patent-search-basic": {
    serviceType: "patent_search",
    title: "Patent Search (Basic)",
  },
  "patent-search-standard": {
    serviceType: "patent_search",
    title: "Patent Search (Standard)",
  },
  "patent-search-premium": {
    serviceType: "patent_search",
    title: "Patent Search (Premium)",
  },
  "patent-drafting-simple": {
    serviceType: "patent_drafting",
    title: "Patent Drafting (Simple)",
  },
  "patent-drafting-mid": {
    serviceType: "patent_drafting",
    title: "Patent Drafting (Mid-Tier)",
  },
  "patent-drafting-complex": {
    serviceType: "patent_drafting",
    title: "Patent Drafting (Complex)",
  },
  "fto-landscape": {
    serviceType: "fto",
    title: "FTO — Patent Landscape",
  },
  "fto-simple": {
    serviceType: "fto",
    title: "FTO (Simple)",
  },
  "fto-complex": {
    serviceType: "fto",
    title: "FTO (Complex)",
  },
  custom: {
    serviceType: "consultation",
    title: "Custom Project",
  },
};

/* ── Webhook handler ─────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe signature or webhook secret");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Only handle checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    await handleCheckoutCompleted(session);
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/* ── Checkout completed handler ──────────────────────────────── */

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const adminClient = createAdminClient();

  // 1. Extract data from session
  const stripeServiceId = session.metadata?.service;
  const email = session.customer_details?.email;
  const amountTotal = session.amount_total; // cents/pence
  const currency = (session.metadata?.currency || "usd").toUpperCase();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  if (!stripeServiceId || !email) {
    console.error("Webhook missing required data:", {
      service: stripeServiceId,
      email,
    });
    throw new Error("Missing service or email in checkout session");
  }

  // 2. Map to portal service type
  const mapping = SERVICE_MAP[stripeServiceId];
  if (!mapping) {
    console.error(`Unknown Stripe service ID: ${stripeServiceId}`);
    throw new Error(`Unknown service: ${stripeServiceId}`);
  }

  const { serviceType } = mapping;

  // For custom projects, use description from metadata as title
  const isCustom = stripeServiceId === "custom";
  const customDescription = session.metadata?.description || null;
  const title = isCustom && customDescription
    ? customDescription.length > 80
      ? customDescription.slice(0, 77) + "..."
      : customDescription
    : mapping.title;

  // 3. Idempotency: check if project already exists for this payment
  if (paymentIntentId) {
    const { data: existing } = await adminClient
      .from("projects")
      .select("id")
      .eq("stripe_payment_id", paymentIntentId)
      .maybeSingle();

    if (existing) {
      console.log(
        `Project already exists for payment ${paymentIntentId}, skipping`
      );
      return;
    }
  }

  // 4. Find or create client
  let clientId: string;
  const customerName =
    session.customer_details?.name || email.split("@")[0];

  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === email
  );

  if (existingUser) {
    clientId = existingUser.id;
    // Update profile with name and email
    await adminClient
      .from("profiles")
      .update({ name: customerName, email })
      .eq("id", clientId);
  } else {
    // Create new user (DB trigger auto-creates profile)
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: customerName },
      });

    if (createError || !newUser.user) {
      throw new Error(
        `Failed to create client: ${createError?.message || "Unknown error"}`
      );
    }

    clientId = newUser.user.id;

    // Update profile with name and email
    await adminClient
      .from("profiles")
      .update({ name: customerName, email })
      .eq("id", clientId);
  }

  // 5. Calculate delivery date
  const timelineDays = DEFAULT_TIMELINES[serviceType] || null;
  const startDate = new Date().toISOString().split("T")[0];
  const estimatedDelivery = timelineDays
    ? calculateDeliveryDate(startDate, timelineDays)
    : null;

  // 6. Create project
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .insert({
      client_id: clientId,
      service_type: serviceType,
      title,
      description: isCustom ? customDescription : null,
      status: "payment_received",
      jurisdictions: [],
      start_date: startDate,
      default_timeline_days: timelineDays,
      estimated_delivery_date: estimatedDelivery,
      price_paid: amountTotal,
      currency,
      stripe_payment_id: paymentIntentId,
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(
      `Failed to create project: ${projectError?.message || "Unknown error"}`
    );
  }

  // 7. Create initial update
  const deliveryNote = estimatedDelivery
    ? `Estimated delivery: ${new Date(estimatedDelivery).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )}.`
    : "";

  await adminClient.from("project_updates").insert({
    project_id: project.id,
    status_to: "payment_received",
    note: `Payment received. ${deliveryNote}`,
    internal_note: `Auto-created from Stripe checkout. Payment: ${paymentIntentId}`,
    notify_client: true,
  });

  // 8. Send welcome email with portal link
  try {
    // Generate magic link for the client
    const { data: linkData } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    const hashedToken = linkData?.properties?.hashed_token;
    const portalUrl = hashedToken
      ? `https://alexander-ip.com/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
      : "https://alexander-ip.com/auth/login";

    await sendProjectCreatedEmail(email, {
      title,
      serviceType,
      estimatedDelivery,
      portalUrl,
    });
  } catch (emailErr) {
    // Don't fail the webhook if email fails — project is already created
    console.error("Failed to send welcome email:", emailErr);
  }

  console.log(
    `[WEBHOOK] Project created: "${title}" for ${email} (${paymentIntentId})`
  );
}
