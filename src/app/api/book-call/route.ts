import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSlot, ukParts } from "@/lib/booking/availability";
import {
  sendBookingRequestReceivedToLead,
  sendBookingRequestNotificationToAdmin,
} from "@/lib/email";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOST_EMAIL_FALLBACK = "alexanderip.contact@gmail.com";
const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

interface BookCallRequest {
  email?: string;
  name?: string;
  stage?: string;
  topic?: string;
  startUtc?: string;
}

const STAGE_VALUES = ["idea", "prototype", "filed", "unsure"] as const;
type Stage = (typeof STAGE_VALUES)[number];

const STAGE_LABELS: Record<Stage, string> = {
  idea: "Just an idea",
  prototype: "Built a prototype / proof of concept",
  filed: "Already filed something",
  unsure: "Not sure",
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

    const body = (await request.json()) as BookCallRequest;

    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const topicRaw = (body.topic || "").trim();
    const topic = topicRaw ? topicRaw.slice(0, 1000) : null;
    const startUtcIso = body.startUtc || "";
    const stage =
      body.stage && (STAGE_VALUES as readonly string[]).includes(body.stage)
        ? (body.stage as Stage)
        : null;
    const stageLabel = stage ? STAGE_LABELS[stage] : null;

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!stage) {
      return NextResponse.json({ error: "Please tell me where you're at with this." }, { status: 400 });
    }
    if (!startUtcIso) {
      return NextResponse.json({ error: "Please pick a slot." }, { status: 400 });
    }

    const slotError = validateSlot(startUtcIso);
    if (slotError) {
      return NextResponse.json({ error: slotError }, { status: 400 });
    }

    const startUtc = new Date(startUtcIso);
    const adminClient = createAdminClient();

    // Race-condition guard: re-check the slot is still free.
    // Both 'pending' (someone else is awaiting approval) and 'booked' (already
    // approved) take a slot off the table; the lead should pick another.
    const { data: clash } = await adminClient
      .from("lead_call_bookings")
      .select("id")
      .eq("scheduled_at", startUtc.toISOString())
      .in("status", ["pending", "booked"])
      .maybeSingle();

    if (clash) {
      return NextResponse.json(
        { error: "Sorry — that slot was just requested by someone else. Please pick another." },
        { status: 409 }
      );
    }

    // Insert the booking row first (so we have a record even if Google fails)
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;

    // Insert as 'pending' — admin will approve or reject from /admin/bookings.
    // No Google Calendar event is created yet; the lead does NOT get a Meet
    // link until the request is approved.
    const { data: inserted, error: insertError } = await adminClient
      .from("lead_call_bookings")
      .insert({
        lead_email: email,
        lead_name: name,
        stage,
        topic,
        scheduled_at: startUtc.toISOString(),
        duration_minutes: 15,
        status: "pending",
        source: "/book-call",
        ip_address: ipAddress,
        user_agent: request.headers.get("user-agent") || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      const msg = insertError?.message || "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return NextResponse.json(
          { error: "Sorry — that slot was just requested. Please pick another." },
          { status: 409 }
        );
      }
      console.error("[book-call] insert failed:", insertError);
      return NextResponse.json(
        { error: "Couldn't save your request. Please try again." },
        { status: 500 }
      );
    }

    // Format human-friendly UK labels for the emails
    const parts = ukParts(startUtc);
    const ukDateLabel = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(startUtc);
    const ukTimeLabel = `${parts.hour.toString().padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;

    const hostEmail = process.env.BOOKING_HOST_EMAIL || HOST_EMAIL_FALLBACK;
    await Promise.all([
      sendBookingRequestReceivedToLead({
        leadName: name,
        leadEmail: email,
        stageLabel,
        topic,
        ukDateLabel,
        ukTimeLabel,
        hostEmail,
      }),
      sendBookingRequestNotificationToAdmin({
        leadName: name,
        leadEmail: email,
        stageLabel,
        topic,
        ukDateLabel,
        ukTimeLabel,
        leadId: inserted.id,
      }),
    ]);

    return NextResponse.json({
      success: true,
      ukDateLabel,
      ukTimeLabel,
    });
  } catch (err) {
    console.error("Book-call error:", err);
    return NextResponse.json(
      { error: "Couldn't submit your request. Please try again." },
      { status: 500 }
    );
  }
}
