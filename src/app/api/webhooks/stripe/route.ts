import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIMELINES,
  calculateDeliveryDate,
} from "@/lib/portal/status";
import { sendProjectCreatedEmail, sendAdminNewOrderEmail } from "@/lib/email";
import type { ServiceType } from "@/lib/supabase/types";
import { generateAndStoreInvoice } from "@/lib/invoice";

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
    serviceType: "custom",
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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Webhook processing error:", errMsg, err);
    // Return 500 so Stripe retries — include message for diagnostics
    return NextResponse.json(
      { error: `Processing failed: ${errMsg}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/* ── Checkout completed handler ──────────────────────────────── */

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[webhook] Processing checkout: ${session.id}`);
  const adminClient = createAdminClient();

  // ── Offer payment detection ──────────────────────────────────
  const offerId = session.metadata?.offer_id;
  if (offerId) {
    await handleOfferPayment(session, offerId, adminClient);
    return;
  }

  // 1. Extract data from session
  const stripeServiceId = session.metadata?.service;
  const email = session.customer_details?.email;
  const amountTotal = session.amount_total; // cents/pence
  const currency = (session.metadata?.currency || "usd").toUpperCase();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  console.log(`[webhook] Service: ${stripeServiceId}, Email: ${email}, Amount: ${amountTotal}, Currency: ${currency}`);

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
      return;
    }
  }

  // 4. Find or create client
  let clientId: string;
  const customerName =
    session.customer_details?.name || email.split("@")[0];

  console.log(`[webhook] Looking up user: ${email}`);

  // Look up existing user by email in profiles table (fast, no pagination issues)
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    clientId = existingProfile.id;
    console.log(`[webhook] Found existing user: ${clientId}`);
    // Update profile with latest name
    await adminClient
      .from("profiles")
      .update({ name: customerName })
      .eq("id", clientId);
  } else {
    // Create new user (trigger auto-creates profile)
    console.log(`[webhook] Creating new user for: ${email}`);
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: customerName },
      });

    if (createError || !newUser?.user) {
      throw new Error(
        `Failed to create client: ${createError?.message || "Unknown error"}`
      );
    }

    clientId = newUser.user.id;
    console.log(`[webhook] Created user: ${clientId}`);
  }

  // 5. Calculate delivery date
  // Use timeline from checkout metadata (rush/emergency), fall back to service default
  const metadataTimeline = session.metadata?.timeline_days
    ? parseInt(session.metadata.timeline_days, 10)
    : null;
  const timelineDays = metadataTimeline || DEFAULT_TIMELINES[serviceType] || null;
  const startDate = new Date().toISOString().split("T")[0];
  const estimatedDelivery = timelineDays
    ? calculateDeliveryDate(startDate, timelineDays)
    : null;
  console.log(`[webhook] Timeline: ${timelineDays} days (metadata: ${metadataTimeline}, default: ${DEFAULT_TIMELINES[serviceType]}), delivery: ${estimatedDelivery}`);

  // 6. Create project
  console.log(`[webhook] Creating project: ${title} (${serviceType}) for client ${clientId}`);
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

  console.log(`[webhook] Project created: ${project.id}`);

  // 7b. Generate invoice PDF (non-blocking)
  try {
    await generateAndStoreInvoice({
      projectId: project.id,
      clientName: customerName,
      clientEmail: email,
      title,
      amountTotal: amountTotal || 0,
      amountTax: session.total_details?.amount_tax || 0,
      currency,
      stripePaymentIntentId: paymentIntentId,
      stripeSessionId: session.id,
    });
  } catch (invoiceErr) {
    console.error("[webhook] Invoice generation failed:", invoiceErr);
  }

  // 7d. Auto-generate welcome message from admin (non-blocking)
  try {
    // Find admin user to send from
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminUser) {
      const welcomeBody = [
        `Hi ${customerName.split(" ")[0]},`,
        "",
        `Thank you for your order — **${title}**. I'm looking forward to working with you on this.`,
        "",
        "A few things to note:",
        "",
        "- **Your VAT invoice** has been automatically generated and is already available in the Documents section of this project.",
        "- **Upload any relevant files** (invention descriptions, sketches, prior art, etc.) using the upload area in the Documents section — this is the easiest way to share materials with me.",
        "- **Use this Messages area** to send me any questions or additional information at any time.",
        "- **Updates on progress** will appear in the Updates feed on this page, and you'll receive email notifications for key milestones.",
        "- **Email notifications** can be toggled on or off at any time using the bell icon on this project page.",
        "",
        "If you have any questions at all, just drop me a message here or email me directly.",
        "",
        "Best regards,",
        "Alex",
      ].join("\n");

      await adminClient.from("project_messages").insert({
        project_id: project.id,
        sender_id: adminUser.id,
        body: welcomeBody,
        is_admin: true,
      });
    }
  } catch (welcomeMsgErr) {
    console.error("[webhook] Welcome message failed:", welcomeMsgErr);
  }

  // 8. Send admin notification email
  try {
    await sendAdminNewOrderEmail({
      clientName: customerName,
      clientEmail: email,
      title,
      serviceType,
      amount: amountTotal || 0,
      currency,
      estimatedDelivery,
      projectId: project.id,
    });
  } catch (adminEmailErr) {
    console.error("Failed to send admin notification:", adminEmailErr);
  }

  // 9. Send welcome email with portal link
  try {
    // Generate magic link for the client
    const { data: linkData } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    const hashedToken = linkData?.properties?.hashed_token;
    const portalUrl = hashedToken
      ? `https://www.alexander-ip.com/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
      : "https://www.alexander-ip.com/auth/login";

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

}


/* ── Offer payment handler ──────────────────────────────────────── */

async function handleOfferPayment(
  session: Stripe.Checkout.Session,
  offerId: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  console.log(`[webhook] Processing offer payment: ${offerId}`);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  // 1. Fetch the offer
  const { data: offer, error: offerError } = await adminClient
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) {
    throw new Error(`Offer not found: ${offerId}`);
  }

  // 2. Idempotency — already accepted?
  if (offer.status === "accepted") {
    console.log(`[webhook] Offer ${offerId} already accepted, skipping`);
    return;
  }

  // 3. Find or create client
  let clientId: string;
  const email = offer.client_email;
  const customerName =
    session.customer_details?.name ||
    offer.client_name ||
    email.split("@")[0];

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    clientId = existingProfile.id;
    await adminClient
      .from("profiles")
      .update({ name: customerName })
      .eq("id", clientId);
  } else {
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: customerName },
      });

    if (createError || !newUser?.user) {
      throw new Error(
        `Failed to create client: ${createError?.message || "Unknown error"}`
      );
    }
    clientId = newUser.user.id;
  }

  // 4. Calculate delivery date
  const serviceType = (offer.service_type || "custom") as ServiceType;
  const timelineDays =
    offer.timeline_days || DEFAULT_TIMELINES[serviceType] || null;
  const startDate = new Date().toISOString().split("T")[0];
  const estimatedDelivery = timelineDays
    ? calculateDeliveryDate(startDate, timelineDays)
    : null;

  // 5. Create project
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .insert({
      client_id: clientId,
      service_type: serviceType,
      title: offer.title,
      description: offer.description,
      status: "payment_received",
      jurisdictions: [],
      start_date: startDate,
      default_timeline_days: timelineDays,
      estimated_delivery_date: estimatedDelivery,
      price_paid: session.amount_total || offer.amount,
      currency: offer.currency,
      stripe_payment_id: paymentIntentId,
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(
      `Failed to create project from offer: ${projectError?.message || "Unknown error"}`
    );
  }

  // 6. Update offer → accepted
  await adminClient
    .from("offers")
    .update({
      status: "accepted",
      stripe_payment_id: paymentIntentId,
      project_id: project.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId);

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
    internal_note: `Auto-created from custom offer ${offerId}. Payment: ${paymentIntentId}`,
    notify_client: true,
  });

  console.log(`[webhook] Offer ${offerId} accepted, project created: ${project.id}`);

  // 8. Generate invoice PDF (non-blocking)
  try {
    await generateAndStoreInvoice({
      projectId: project.id,
      clientName: customerName,
      clientEmail: email,
      title: offer.title,
      amountTotal: session.amount_total || offer.amount,
      amountTax: session.total_details?.amount_tax || 0,
      currency: offer.currency,
      stripePaymentIntentId: paymentIntentId,
      stripeSessionId: session.id,
    });
  } catch (invoiceErr) {
    console.error("[webhook] Invoice generation failed:", invoiceErr);
  }

  // 8c. Auto-generate welcome message from admin (non-blocking)
  try {
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminUser) {
      const welcomeBody = [
        `Hi ${customerName.split(" ")[0]},`,
        "",
        `Thank you for your order — **${offer.title}**. I'm looking forward to working with you on this.`,
        "",
        "A few things to note:",
        "",
        "- **Your VAT invoice** has been automatically generated and is already available in the Documents section of this project.",
        "- **Upload any relevant files** (invention descriptions, sketches, prior art, etc.) using the upload area in the Documents section — this is the easiest way to share materials with me.",
        "- **Use this Messages area** to send me any questions or additional information at any time.",
        "- **Updates on progress** will appear in the Updates feed on this page, and you'll receive email notifications for key milestones.",
        "- **Email notifications** can be toggled on or off at any time using the bell icon on this project page.",
        "",
        "If you have any questions at all, just drop me a message here or email me directly.",
        "",
        "Best regards,",
        "Alex",
      ].join("\n");

      await adminClient.from("project_messages").insert({
        project_id: project.id,
        sender_id: adminUser.id,
        body: welcomeBody,
        is_admin: true,
      });
    }
  } catch (welcomeMsgErr) {
    console.error("[webhook] Welcome message failed:", welcomeMsgErr);
  }

  // 9. Send admin notification
  try {
    await sendAdminNewOrderEmail({
      clientName: customerName,
      clientEmail: email,
      title: offer.title,
      serviceType,
      amount: session.amount_total || offer.amount,
      currency: offer.currency,
      estimatedDelivery,
      projectId: project.id,
    });
  } catch (adminEmailErr) {
    console.error("Failed to send admin notification:", adminEmailErr);
  }

  // 10. Send welcome email with portal link
  try {
    const { data: linkData } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    const hashedToken = linkData?.properties?.hashed_token;
    const portalUrl = hashedToken
      ? `https://www.alexander-ip.com/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
      : "https://www.alexander-ip.com/auth/login";

    await sendProjectCreatedEmail(email, {
      title: offer.title,
      serviceType,
      estimatedDelivery,
      portalUrl,
    });
  } catch (emailErr) {
    console.error("Failed to send welcome email:", emailErr);
  }
}
