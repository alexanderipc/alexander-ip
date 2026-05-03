import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSlot, ukParts } from "@/lib/booking/availability";
import {
  createBookingEvent,
  isGoogleCalendarConfigured,
} from "@/lib/booking/google-calendar";
import {
  sendBookingConfirmationToLead,
  sendBookingNotificationToAdmin,
} from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOST_EMAIL_FALLBACK = "alexanderip.contact@gmail.com";

interface BookCallRequest {
  email?: string;
  name?: string;
  topic?: string;
  startUtc?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookCallRequest;

    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const topicRaw = (body.topic || "").trim();
    const topic = topicRaw ? topicRaw.slice(0, 1000) : null;
    const startUtcIso = body.startUtc || "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
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

    // Race-condition guard: re-check the slot is still free
    const { data: clash } = await adminClient
      .from("lead_call_bookings")
      .select("id")
      .eq("scheduled_at", startUtc.toISOString())
      .eq("status", "booked")
      .maybeSingle();

    if (clash) {
      return NextResponse.json(
        { error: "Sorry — someone just booked that slot. Please pick another." },
        { status: 409 }
      );
    }

    // Insert the booking row first (so we have a record even if Google fails)
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const { data: inserted, error: insertError } = await adminClient
      .from("lead_call_bookings")
      .insert({
        lead_email: email,
        lead_name: name,
        topic,
        scheduled_at: startUtc.toISOString(),
        duration_minutes: 15,
        source: "/book-call",
        ip_address: ipAddress,
        user_agent: request.headers.get("user-agent") || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      // Most likely the unique-slot index caught a race
      const msg = insertError?.message || "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return NextResponse.json(
          { error: "Sorry — someone just booked that slot. Please pick another." },
          { status: 409 }
        );
      }
      console.error("[book-call] insert failed:", insertError);
      return NextResponse.json(
        { error: "Couldn't save your booking. Please try again." },
        { status: 500 }
      );
    }

    // Try to create the Google Calendar event (with Meet link). If it fails or
    // Google isn't configured, the booking still stands — we just send a
    // Resend-only confirmation and notify admin to invite manually.
    let meetUrl: string | null = null;
    let googleEventId: string | null = null;
    let googleError: string | null = null;
    const googleConfigured = isGoogleCalendarConfigured();
    if (googleConfigured) {
      try {
        const event = await createBookingEvent({
          startUtc,
          durationMinutes: 15,
          leadEmail: email,
          leadName: name,
          topic,
        });
        if (event) {
          meetUrl = event.meetUrl;
          googleEventId = event.eventId;
          await adminClient
            .from("lead_call_bookings")
            .update({
              google_event_id: event.eventId,
              google_meet_url: event.meetUrl,
            })
            .eq("id", inserted.id);
        } else {
          googleError = "createBookingEvent returned null";
        }
      } catch (err) {
        googleError = err instanceof Error ? err.message : String(err);
        console.error("[book-call] Google event creation failed:", err);
      }
    }

    // Format human-friendly UK labels for the confirmation emails
    const parts = ukParts(startUtc);
    const ukDateLabel = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(startUtc);
    const ukTimeLabel = `${parts.hour.toString().padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;

    // Fire confirmation emails (await so failures surface, but they swallow errors internally)
    const hostEmail = process.env.BOOKING_HOST_EMAIL || HOST_EMAIL_FALLBACK;
    await Promise.all([
      sendBookingConfirmationToLead({
        leadName: name,
        leadEmail: email,
        topic,
        ukDateLabel,
        ukTimeLabel,
        meetUrl,
        hostEmail,
      }),
      sendBookingNotificationToAdmin({
        leadName: name,
        leadEmail: email,
        topic,
        ukDateLabel,
        ukTimeLabel,
        meetUrl,
        hostEmail,
        leadId: inserted.id,
        googleConfigured,
        googleError,
      }),
    ]);

    return NextResponse.json({
      success: true,
      ukDateLabel,
      ukTimeLabel,
      meetUrl,
      hasCalendarEvent: Boolean(googleEventId),
    });
  } catch (err) {
    console.error("Book-call error:", err);
    return NextResponse.json(
      { error: "Couldn't book the call. Please try again." },
      { status: 500 }
    );
  }
}
