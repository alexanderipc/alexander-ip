import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIMELINES,
  calculateDeliveryDate,
} from "@/lib/portal/status";
import {
  sendProjectCreatedEmail,
  sendAdminNewOrderEmail,
  sendMagicLinkEmail,
  sendConsultationBookingConfirmationToLead,
  sendConsultationBookingNotificationToAdmin,
} from "@/lib/email";
import type { ServiceType } from "@/lib/supabase/types";
import { generateAndStoreInvoice } from "@/lib/invoice";
import { getOfficeLabel, convertCurrencySmallest } from "@/lib/pricing";
import {
  createBookingEvent,
  isGoogleCalendarConfigured,
} from "@/lib/booking/google-calendar";
import { ukParts } from "@/lib/booking/availability";
import {
  attachGuidanceDocToProject,
  buildWelcomeContent,
} from "@/lib/welcome";

export const runtime = "nodejs";

function formatBillingAddress(session: Stripe.Checkout.Session): string | null {
  const addr = session.customer_details?.address;
  if (!addr) return null;

  const parts: string[] = [];
  if (addr.line1) parts.push(addr.line1);
  if (addr.line2) parts.push(addr.line2);

  const cityPostal: string[] = [];
  if (addr.city) cityPostal.push(addr.city);
  if (addr.state) cityPostal.push(addr.state);
  if (addr.postal_code) cityPostal.push(addr.postal_code);
  if (cityPostal.length) parts.push(cityPostal.join(", "));

  if (addr.country) parts.push(addr.country);

  return parts.length > 0 ? parts.join("\n") : null;
}

/* ── Save billing address to profile ──────────────────────────── */

async function saveBillingAddressToProfile(
  adminClient: ReturnType<typeof createAdminClient>,
  profileId: string,
  session: Stripe.Checkout.Session
) {
  const cd = session.customer_details;
  if (!cd) return;

  // Only update fields that Stripe provided (don't overwrite existing data with nulls)
  const update: Record<string, string | null> = {};

  // Always update name from Stripe if available (most accurate source)
  if (cd.name) update.name = cd.name;

  const addr = cd.address;
  if (addr) {
    if (addr.line1 !== undefined) update.address_line1 = addr.line1;
    if (addr.line2 !== undefined) update.address_line2 = addr.line2;
    if (addr.city !== undefined) update.city = addr.city;
    if (addr.postal_code !== undefined) update.postal_code = addr.postal_code;
    if (addr.country !== undefined) update.country = addr.country;
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await adminClient
    .from("profiles")
    .update(update)
    .eq("id", profileId);

  if (error) {
    console.error("[webhook] Failed to save billing details:", error.message);
  }
}

/* ── Team-member invites from Stripe custom_fields ───────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function inviteTeamMembersFromCheckout(
  adminClient: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  projectId: string,
  ownerEmail: string
): Promise<void> {
  const field = session.custom_fields?.find((f) => f.key === "team_emails");
  const raw = field?.text?.value;
  if (!raw) return;

  const ownerLower = ownerEmail.toLowerCase();
  const seen = new Set<string>();
  const emails = raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      if (!EMAIL_RE.test(e)) return false;
      if (e === ownerLower) return false;
      if (seen.has(e)) return false;
      seen.add(e);
      return true;
    });

  if (!emails.length) return;

  console.log(`[webhook] Inviting ${emails.length} team member(s) to project ${projectId}`);

  for (const inviteEmail of emails) {
    try {
      // Find or create profile
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail)
        .maybeSingle();

      let inviteeId: string;
      if (existingProfile) {
        inviteeId = existingProfile.id;
      } else {
        const { data: newUser, error: createError } =
          await adminClient.auth.admin.createUser({
            email: inviteEmail,
            email_confirm: false,
          });
        if (createError || !newUser?.user) {
          console.error(`[webhook] Failed to create invitee ${inviteEmail}:`, createError?.message);
          continue;
        }
        inviteeId = newUser.user.id;
      }

      // Skip if already a member (defensive — race conditions, retries)
      const { data: alreadyMember } = await adminClient
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", inviteeId)
        .maybeSingle();
      if (alreadyMember) continue;

      const { error: memberError } = await adminClient
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: inviteeId,
          role: "member",
        });
      if (memberError) {
        console.error(`[webhook] Failed to add ${inviteEmail} as member:`, memberError.message);
        continue;
      }

      // Send magic-link login email
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: inviteEmail,
      });
      const hashedToken = linkData?.properties?.hashed_token;
      if (hashedToken) {
        const verifyUrl = `https://www.alexander-ip.com/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`;
        await sendMagicLinkEmail(inviteEmail, verifyUrl);
      }
    } catch (err) {
      console.error(`[webhook] Team-member invite failed for ${inviteEmail}:`, err);
    }
  }
}

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
    title: "FTO \u2014 Patent Landscape",
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
      { error: "Webhook signature verification failed" },
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
    // Return 500 so Stripe retries — generic message only (details in server logs)
    return NextResponse.json(
      { error: "Processing failed" },
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

  // 4b. Save billing address from Stripe to profile
  await saveBillingAddressToProfile(adminClient, clientId, session);

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

  // 7b. Add client as project owner in project_members
  await adminClient.from("project_members").insert({
    project_id: project.id,
    user_id: clientId,
    role: "owner",
  });

  console.log(`[webhook] Project created: ${project.id}`);

  // 7c. Invite any team members the client added at Stripe checkout (non-blocking)
  try {
    await inviteTeamMembersFromCheckout(adminClient, session, project.id, email);
  } catch (teamErr) {
    console.error("[webhook] Team-member invite stage failed:", teamErr);
  }

  // 7b. Generate invoice PDF (non-blocking)
  try {
    await generateAndStoreInvoice({
      projectId: project.id,
      clientName: customerName,
      clientEmail: email,
      clientAddress: formatBillingAddress(session),
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

  // 7d. Auto-generate welcome message from admin (non-blocking).
  //     For patent_drafting and patent_search projects, also attaches the
  //     matching Invention Disclosure Guidance .docx to the message AND
  //     creates a project_documents row so it appears in the Documents tab.
  try {
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminUser) {
      const guidance = await attachGuidanceDocToProject(
        adminClient,
        project.id,
        serviceType,
        adminUser.id
      );

      const welcome = buildWelcomeContent(
        serviceType,
        customerName.split(" ")[0],
        title,
        estimatedDelivery,
        guidance
      );

      await adminClient.from("project_messages").insert({
        project_id: project.id,
        sender_id: adminUser.id,
        body: welcome.body,
        body_format: welcome.body_format,
        attachments: welcome.attachments,
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

  // 10. Consultation slot booking finalisation — only fires if this checkout
  // came from /book-consultation, which sets `consultation_booking_id` in
  // metadata. Marks the booking paid, creates a Google Calendar event with a
  // Meet link, sends scheduling-specific emails, and links the booking to
  // the project that was just created.
  const consultationBookingId = session.metadata?.consultation_booking_id;
  if (consultationBookingId) {
    try {
      await finaliseConsultationBooking({
        adminClient,
        bookingId: consultationBookingId,
        leadEmail: email,
        leadName: customerName,
        projectId: project.id,
        paymentIntentId,
      });
    } catch (cbErr) {
      // Don't fail the webhook — payment is captured, project exists. We
      // surface the issue so admin can manually invite if needed.
      console.error("[webhook] Consultation booking finalisation failed:", cbErr);
    }
  }
}

/* ── Consultation booking finaliser ──────────────────────────────── */

async function finaliseConsultationBooking(args: {
  adminClient: ReturnType<typeof createAdminClient>;
  bookingId: string;
  leadEmail: string;
  leadName: string;
  projectId: string;
  paymentIntentId: string | null;
}): Promise<void> {
  const { adminClient, bookingId, leadEmail, leadName, projectId, paymentIntentId } = args;

  const { data: booking, error: fetchErr } = await adminClient
    .from("paid_consultation_bookings")
    .select(
      "id, scheduled_at, duration_minutes, stage, topic, status, google_event_id"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchErr || !booking) {
    console.error("[webhook] consultation booking not found:", bookingId, fetchErr);
    return;
  }

  // Idempotency: if it's already paid + has an event, nothing to do.
  if (booking.status === "paid" && booking.google_event_id) {
    return;
  }

  const startUtc = new Date(booking.scheduled_at);
  const stage = booking.stage as
    | "idea"
    | "prototype"
    | "filed"
    | "unsure"
    | null;
  const stageLabels: Record<string, string> = {
    idea: "Just an idea",
    prototype: "Built a prototype / proof of concept",
    filed: "Already filed something",
    unsure: "Not sure",
  };
  const stageLabel = stage ? stageLabels[stage] : null;

  // Mark paid + link to the project regardless of Google success.
  await adminClient
    .from("paid_consultation_bookings")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      project_id: projectId,
    })
    .eq("id", bookingId);

  // Create Google Calendar event with Meet link.
  let meetUrl: string | null = null;
  let googleEventId: string | null = null;
  let googleError: string | null = null;
  const googleConfigured = isGoogleCalendarConfigured();
  if (googleConfigured) {
    try {
      const event = await createBookingEvent({
        startUtc,
        durationMinutes: booking.duration_minutes ?? 60,
        leadEmail,
        leadName,
        stageLabel,
        topic: booking.topic,
        kind: "paid_consultation",
      });
      if (event) {
        meetUrl = event.meetUrl;
        googleEventId = event.eventId;
        await adminClient
          .from("paid_consultation_bookings")
          .update({
            google_event_id: event.eventId,
            google_meet_url: event.meetUrl,
          })
          .eq("id", bookingId);
      } else {
        googleError = "createBookingEvent returned null";
      }
    } catch (err) {
      googleError = err instanceof Error ? err.message : String(err);
      console.error(
        "[webhook] Consultation Google event creation failed:",
        err
      );
    }
  }

  // Format human-friendly UK labels for the confirmation emails.
  const parts = ukParts(startUtc);
  const ukDateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(startUtc);
  const ukTimeLabel = `${parts.hour.toString().padStart(2, "0")}:${parts.minute
    .toString()
    .padStart(2, "0")}`;
  const hostEmail =
    process.env.BOOKING_HOST_EMAIL || "alexanderip.contact@gmail.com";

  await Promise.all([
    sendConsultationBookingConfirmationToLead({
      leadName,
      leadEmail,
      stageLabel,
      topic: booking.topic,
      ukDateLabel,
      ukTimeLabel,
      durationMinutes: booking.duration_minutes ?? 60,
      meetUrl,
      hostEmail,
    }),
    sendConsultationBookingNotificationToAdmin({
      leadName,
      leadEmail,
      stageLabel,
      topic: booking.topic,
      ukDateLabel,
      ukTimeLabel,
      durationMinutes: booking.duration_minutes ?? 60,
      meetUrl,
      hostEmail,
      bookingId,
      projectId,
      googleConfigured,
      googleError,
    }),
  ]);
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

  // ── Determine if this is an installment payment ──
  const totalInstallments = offer.installments || 1;
  const isInstallmentPlan = totalInstallments > 1;
  const installmentNumber = session.metadata?.installment_number
    ? parseInt(session.metadata.installment_number, 10)
    : 1;

  // ── Installment idempotency check ──
  if (isInstallmentPlan) {
    const { data: existingPayment } = await adminClient
      .from("installment_payments")
      .select("id")
      .eq("offer_id", offerId)
      .eq("installment_number", installmentNumber)
      .maybeSingle();

    if (existingPayment) {
      console.log(`[webhook] Installment ${installmentNumber} already recorded for offer ${offerId}, skipping`);
      return;
    }
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

  // Save billing address from Stripe to profile
  await saveBillingAddressToProfile(adminClient, clientId, session);

  // ═══════════════════════════════════════════════════════════════
  // EXTRA OFFER (project_id already set) — invoice only, no new project
  // ═══════════════════════════════════════════════════════════════
  if (offer.project_id && offer.is_extra) {
    const serviceType = (offer.service_type || "custom") as ServiceType;

    // Mark offer as accepted
    await adminClient
      .from("offers")
      .update({
        status: "accepted",
        stripe_payment_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    // Fetch existing project for invoice
    const { data: existingProject } = await adminClient
      .from("projects")
      .select("*")
      .eq("id", offer.project_id)
      .single();

    if (!existingProject) {
      throw new Error(`Extra offer project not found: ${offer.project_id}`);
    }

    // Generate invoice on the existing project
    const invoiceTitle = `${offer.title} (Extra)`;
    try {
      await generateAndStoreInvoice({
        projectId: existingProject.id,
        clientName: customerName,
        clientEmail: email,
        clientAddress: formatBillingAddress(session),
        title: invoiceTitle,
        amountTotal: session.amount_total || offer.amount,
        amountTax: session.total_details?.amount_tax || 0,
        currency: offer.currency,
        stripePaymentIntentId: paymentIntentId,
        stripeSessionId: session.id,
      });
    } catch (invoiceErr) {
      console.error("[webhook] Extra offer invoice generation failed:", invoiceErr);
    }

    console.log(`[webhook] Extra offer ${offerId} accepted, invoice added to project ${existingProject.id}`);
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // SINGLE PAYMENT (installments <= 1) — original flow, unchanged
  // ═══════════════════════════════════════════════════════════════
  if (!isInstallmentPlan) {
    // Idempotency: check if a project already exists for this payment
    if (paymentIntentId) {
      const { data: existingProject } = await adminClient
        .from("projects")
        .select("id")
        .eq("stripe_payment_id", paymentIntentId)
        .maybeSingle();
      if (existingProject) {
        console.log(`[webhook] Project already exists for payment ${paymentIntentId}, skipping offer ${offerId}`);
        return;
      }
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

    // Extract official fee info from metadata
    const hasOfficialFees = session.metadata?.has_official_fees === "true";
    let officialFeeDescription: string | null = null;
    let officialFeeAmountConverted: number | null = null;
    let coverFeeAmount: number | null = null;

    if (hasOfficialFees) {
      const feeOffice = session.metadata?.official_fee_office || "";
      const feeSubOffice = session.metadata?.official_fee_sub_office || null;
      const feeCurrency = session.metadata?.official_fee_currency || "";
      const feeAmountNative = parseInt(session.metadata?.official_fee_amount || "0", 10);
      coverFeeAmount = parseInt(session.metadata?.cover_fee_amount || "0", 10) || null;

      const officeLabel = getOfficeLabel(feeOffice, feeSubOffice);
      officialFeeDescription = `Official Patent Office Fees \u2014 ${officeLabel} (Handling As Agent)`;
      officialFeeAmountConverted = convertCurrencySmallest(feeAmountNative, feeCurrency, offer.currency);
    }

    // 7. Create initial update + project member + invoice + welcome + emails
    await postPaymentActions(adminClient, {
      project,
      offer,
      clientId,
      customerName,
      email,
      serviceType,
      estimatedDelivery,
      paymentIntentId,
      session,
      invoiceTitle: offer.title,
      officialFeeDescription,
      officialFeeAmount: officialFeeAmountConverted,
      coverFeeAmount,
    });

    console.log(`[webhook] Offer ${offerId} accepted, project created: ${project.id}`);
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // INSTALLMENT PAYMENT — branched flow
  // ═══════════════════════════════════════════════════════════════

  const serviceType = (offer.service_type || "custom") as ServiceType;

  // Record the installment payment
  await adminClient.from("installment_payments").insert({
    offer_id: offerId,
    installment_number: installmentNumber,
    amount: session.amount_total || 0,
    stripe_payment_id: paymentIntentId,
    stripe_session_id: session.id,
  });

  // Determine installment position before the atomic update
  const isFirstInstallment = installmentNumber === 1;

  // Atomically increment installments_paid to avoid race conditions on concurrent webhooks.
  // We use an RPC-style raw update with a SQL expression via .rpc or a two-step approach:
  // Update where id matches, setting installments_paid = COALESCE(installments_paid, 0) + 1
  const { data: updatedOffer, error: incrementError } = await adminClient
    .from("offers")
    .update({
      installments_paid: (offer.installments_paid || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId)
    .eq("installments_paid", offer.installments_paid || 0) // optimistic lock
    .select("installments_paid")
    .maybeSingle();

  if (incrementError || !updatedOffer) {
    // Optimistic lock failed — another webhook already incremented this.
    // Re-read the offer to get current state.
    console.warn(`[webhook] Optimistic lock failed for offer ${offerId} installment ${installmentNumber}, re-reading...`);
    const { data: freshOffer } = await adminClient
      .from("offers")
      .select("installments_paid, project_id, status")
      .eq("id", offerId)
      .single();
    if (freshOffer?.status === "accepted") {
      console.log(`[webhook] Offer ${offerId} already accepted, skipping duplicate installment`);
      return;
    }
    // If not accepted yet, this installment's payment was still recorded above — just skip the double-update
    return;
  }

  const newPaidCount = updatedOffer.installments_paid;
  const isFinalInstallment = newPaidCount >= totalInstallments;

  // Build remaining offer update fields (the increment already happened above)
  const offerUpdate: Record<string, unknown> = {};
  if (isFinalInstallment) {
    offerUpdate.status = "accepted";
    offerUpdate.stripe_payment_id = paymentIntentId; // last payment ID
  }

  // Invoice title includes installment info
  const invoiceTitle = `${offer.title} \u2014 Installment ${installmentNumber} of ${totalInstallments}`;

  if (isFirstInstallment) {
    // ── FIRST INSTALLMENT: create project + full onboarding ──
    const timelineDays =
      offer.timeline_days || DEFAULT_TIMELINES[serviceType] || null;
    const startDate = new Date().toISOString().split("T")[0];
    const estimatedDelivery = timelineDays
      ? calculateDeliveryDate(startDate, timelineDays)
      : null;

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
        price_paid: offer.amount, // total price (not just this installment)
        currency: offer.currency,
        stripe_payment_id: paymentIntentId,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(
        `Failed to create project from offer installment: ${projectError?.message || "Unknown error"}`
      );
    }

    // Link project to offer
    offerUpdate.project_id = project.id;
    await adminClient
      .from("offers")
      .update(offerUpdate)
      .eq("id", offerId);

    // Extract official fee info from metadata (for installment 1)
    const hasOfficialFeesInst = session.metadata?.has_official_fees === "true";
    let officialFeeDescInst: string | null = null;
    let officialFeeAmountInst: number | null = null;
    let coverFeeAmountInst: number | null = null;

    if (hasOfficialFeesInst) {
      const feeOffice = session.metadata?.official_fee_office || "";
      const feeSubOffice = session.metadata?.official_fee_sub_office || null;
      const feeCurrency = session.metadata?.official_fee_currency || "";
      const feeAmountNative = parseInt(session.metadata?.official_fee_amount || "0", 10);
      coverFeeAmountInst = parseInt(session.metadata?.cover_fee_amount || "0", 10) || null;

      const officeLabel = getOfficeLabel(feeOffice, feeSubOffice);
      officialFeeDescInst = `Official Patent Office Fees \u2014 ${officeLabel} (Handling As Agent)`;
      officialFeeAmountInst = convertCurrencySmallest(feeAmountNative, feeCurrency, offer.currency);
    }

    // Full onboarding: update, member, invoice, welcome, emails
    await postPaymentActions(adminClient, {
      project,
      offer,
      clientId,
      customerName,
      email,
      serviceType,
      estimatedDelivery,
      paymentIntentId,
      session,
      invoiceTitle,
      installmentNote: `Installment 1 of ${totalInstallments} received. ${totalInstallments - 1} installments remaining.`,
      officialFeeDescription: officialFeeDescInst,
      officialFeeAmount: officialFeeAmountInst,
      coverFeeAmount: coverFeeAmountInst,
    });

    console.log(`[webhook] Offer ${offerId} installment 1/${totalInstallments}, project created: ${project.id}`);

  } else {
    // ── MIDDLE or FINAL INSTALLMENT: invoice only, no new project ──
    await adminClient
      .from("offers")
      .update(offerUpdate)
      .eq("id", offerId);

    const projectId = offer.project_id;
    if (!projectId) {
      console.error(`[webhook] Offer ${offerId} has no project_id for installment ${installmentNumber}`);
      return;
    }

    // Extract official fee info from metadata (for later installments)
    const hasOfficialFeesLater = session.metadata?.has_official_fees === "true";
    let officialFeeDescLater: string | null = null;
    let officialFeeAmountLater: number | null = null;
    let coverFeeAmountLater: number | null = null;

    if (hasOfficialFeesLater) {
      const feeOffice = session.metadata?.official_fee_office || "";
      const feeSubOffice = session.metadata?.official_fee_sub_office || null;
      const feeCurrency = session.metadata?.official_fee_currency || "";
      const feeAmountNative = parseInt(session.metadata?.official_fee_amount || "0", 10);
      coverFeeAmountLater = parseInt(session.metadata?.cover_fee_amount || "0", 10) || null;

      const officeLabel = getOfficeLabel(feeOffice, feeSubOffice);
      officialFeeDescLater = `Official Patent Office Fees \u2014 ${officeLabel} (Handling As Agent)`;
      officialFeeAmountLater = convertCurrencySmallest(feeAmountNative, feeCurrency, offer.currency);
    }

    // Generate installment invoice
    try {
      await generateAndStoreInvoice({
        projectId,
        clientName: customerName,
        clientEmail: email,
        clientAddress: formatBillingAddress(session),
        title: invoiceTitle,
        amountTotal: session.amount_total || 0,
        amountTax: session.total_details?.amount_tax || 0,
        currency: offer.currency,
        stripePaymentIntentId: paymentIntentId,
        stripeSessionId: session.id,
        officialFeeDescription: officialFeeDescLater,
        officialFeeAmount: officialFeeAmountLater,
        coverFeeAmount: coverFeeAmountLater,
      });
    } catch (invoiceErr) {
      console.error("[webhook] Installment invoice generation failed:", invoiceErr);
    }

    // Add project update
    const updateNote = isFinalInstallment
      ? `Final installment received (${installmentNumber} of ${totalInstallments}). Project fully paid.`
      : `Installment ${installmentNumber} of ${totalInstallments} received. ${totalInstallments - newPaidCount} remaining.`;

    await adminClient.from("project_updates").insert({
      project_id: projectId,
      status_to: "payment_received",
      note: updateNote,
      internal_note: `Installment payment ${installmentNumber}/${totalInstallments}. Payment: ${paymentIntentId}`,
      notify_client: true,
    });

    // Notify admin
    try {
      await sendAdminNewOrderEmail({
        clientName: customerName,
        clientEmail: email,
        title: invoiceTitle,
        serviceType,
        amount: session.amount_total || 0,
        currency: offer.currency,
        estimatedDelivery: null,
        projectId,
      });
    } catch (adminEmailErr) {
      console.error("Failed to send admin installment notification:", adminEmailErr);
    }

    console.log(`[webhook] Offer ${offerId} installment ${installmentNumber}/${totalInstallments}${isFinalInstallment ? " (FINAL)" : ""}`);
  }
}


/* ── Shared post-payment actions (project update, member, invoice, welcome, emails) ── */

async function postPaymentActions(
  adminClient: ReturnType<typeof createAdminClient>,
  params: {
    project: { id: string };
    offer: { id: string; title: string; currency: string };
    clientId: string;
    customerName: string;
    email: string;
    serviceType: ServiceType;
    estimatedDelivery: string | null;
    paymentIntentId: string | null;
    session: Stripe.Checkout.Session;
    invoiceTitle: string;
    installmentNote?: string;
    officialFeeDescription?: string | null;
    officialFeeAmount?: number | null;
    coverFeeAmount?: number | null;
  }
) {
  const { project, offer, clientId, customerName, email, serviceType, estimatedDelivery, paymentIntentId, session, invoiceTitle, installmentNote, officialFeeDescription, officialFeeAmount, coverFeeAmount } = params;

  // Create initial update
  const deliveryNote = estimatedDelivery
    ? `Estimated delivery: ${new Date(estimatedDelivery).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )}.`
    : "";

  const noteText = installmentNote
    ? `${installmentNote} ${deliveryNote}`
    : `Payment received. ${deliveryNote}`;

  await adminClient.from("project_updates").insert({
    project_id: project.id,
    status_to: "payment_received",
    note: noteText,
    internal_note: `Auto-created from custom offer ${offer.id}. Payment: ${paymentIntentId}`,
    notify_client: true,
  });

  // Add client as project owner
  await adminClient.from("project_members").insert({
    project_id: project.id,
    user_id: clientId,
    role: "owner",
  });

  // Generate invoice PDF
  try {
    await generateAndStoreInvoice({
      projectId: project.id,
      clientName: customerName,
      clientEmail: email,
      clientAddress: formatBillingAddress(session),
      title: invoiceTitle,
      amountTotal: session.amount_total || 0,
      amountTax: session.total_details?.amount_tax || 0,
      currency: offer.currency,
      stripePaymentIntentId: paymentIntentId,
      stripeSessionId: session.id,
      officialFeeDescription: officialFeeDescription || null,
      officialFeeAmount: officialFeeAmount || null,
      coverFeeAmount: coverFeeAmount || null,
    });
  } catch (invoiceErr) {
    console.error("[webhook] Invoice generation failed:", invoiceErr);
  }

  // Auto-generate welcome message (with guidance doc for drafting/search)
  try {
    const { data: adminUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminUser) {
      const guidance = await attachGuidanceDocToProject(
        adminClient,
        project.id,
        serviceType,
        adminUser.id
      );

      const welcome = buildWelcomeContent(
        serviceType,
        customerName.split(" ")[0],
        offer.title,
        estimatedDelivery,
        guidance
      );

      await adminClient.from("project_messages").insert({
        project_id: project.id,
        sender_id: adminUser.id,
        body: welcome.body,
        body_format: welcome.body_format,
        attachments: welcome.attachments,
        is_admin: true,
      });
    }
  } catch (welcomeMsgErr) {
    console.error("[webhook] Welcome message failed:", welcomeMsgErr);
  }

  // Send admin notification
  try {
    await sendAdminNewOrderEmail({
      clientName: customerName,
      clientEmail: email,
      title: invoiceTitle,
      serviceType,
      amount: session.amount_total || 0,
      currency: offer.currency,
      estimatedDelivery,
      projectId: project.id,
    });
  } catch (adminEmailErr) {
    console.error("Failed to send admin notification:", adminEmailErr);
  }

  // Send welcome email with portal link
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
