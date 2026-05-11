"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ukParts } from "@/lib/booking/availability";
import {
  createBookingEvent,
  isGoogleCalendarConfigured,
} from "@/lib/booking/google-calendar";
import {
  sendBookingConfirmationToLead,
  sendBookingRejectedToLead,
} from "@/lib/email";

const HOST_EMAIL_FALLBACK = "alexanderip.contact@gmail.com";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { adminClient };
}

function formatUkLabels(scheduledAtIso: string): {
  ukDateLabel: string;
  ukTimeLabel: string;
} {
  const date = new Date(scheduledAtIso);
  const parts = ukParts(date);
  const ukDateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const ukTimeLabel = `${parts.hour.toString().padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;
  return { ukDateLabel, ukTimeLabel };
}

const STAGE_LABELS: Record<string, string> = {
  idea: "Just an idea",
  prototype: "Built a prototype / proof of concept",
  filed: "Already filed something",
  unsure: "Not sure",
};

export async function approveBookingAction(bookingId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const { adminClient } = await requireAdmin();

    const { data: booking, error: fetchErr } = await adminClient
      .from("lead_call_bookings")
      .select(
        "id, lead_name, lead_email, stage, topic, scheduled_at, duration_minutes, status"
      )
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return { ok: false, error: "Booking not found." };
    }
    if (booking.status !== "pending") {
      return { ok: false, error: `Booking is not pending (status: ${booking.status}).` };
    }

    const startUtc = new Date(booking.scheduled_at);
    const stageLabel = booking.stage ? STAGE_LABELS[booking.stage] ?? null : null;

    // Create the Google Calendar event (with Meet link). If Google fails the
    // approval is aborted — we don't want a half-approved row where the lead
    // has been emailed but no calendar event exists.
    if (!isGoogleCalendarConfigured()) {
      return {
        ok: false,
        error: "Google Calendar isn't configured on this environment. Approve from production.",
      };
    }

    let meetUrl: string | null = null;
    let googleEventId: string | null = null;
    try {
      const event = await createBookingEvent({
        startUtc,
        durationMinutes: booking.duration_minutes ?? 15,
        leadEmail: booking.lead_email,
        leadName: booking.lead_name,
        stageLabel,
        topic: booking.topic,
      });
      if (!event) {
        return { ok: false, error: "Google Calendar returned no event." };
      }
      meetUrl = event.meetUrl;
      googleEventId = event.eventId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Google Calendar error: ${msg}` };
    }

    // Mark approved
    const { error: updateErr } = await adminClient
      .from("lead_call_bookings")
      .update({
        status: "booked",
        google_event_id: googleEventId,
        google_meet_url: meetUrl,
        decided_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    if (updateErr) {
      return { ok: false, error: `DB update failed: ${updateErr.message}` };
    }

    // Email the lead (do not await — keep the action snappy and don't block on Resend)
    const { ukDateLabel, ukTimeLabel } = formatUkLabels(booking.scheduled_at);
    const hostEmail = process.env.BOOKING_HOST_EMAIL || HOST_EMAIL_FALLBACK;
    await sendBookingConfirmationToLead({
      leadName: booking.lead_name,
      leadEmail: booking.lead_email,
      stageLabel,
      topic: booking.topic,
      ukDateLabel,
      ukTimeLabel,
      meetUrl,
      hostEmail,
    });

    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("approveBookingAction failed:", err);
    return { ok: false, error: msg };
  }
}

export async function rejectBookingAction(
  bookingId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { adminClient } = await requireAdmin();

    const trimmedReason = (reason || "").trim();
    if (trimmedReason.length < 10) {
      return {
        ok: false,
        error: "Please give a real reason (at least 10 characters) — the lead reads it verbatim.",
      };
    }
    if (trimmedReason.length > 2000) {
      return { ok: false, error: "Reason is too long (max 2000 characters)." };
    }

    const { data: booking, error: fetchErr } = await adminClient
      .from("lead_call_bookings")
      .select("id, lead_name, lead_email, scheduled_at, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return { ok: false, error: "Booking not found." };
    }
    if (booking.status !== "pending") {
      return { ok: false, error: `Booking is not pending (status: ${booking.status}).` };
    }

    const { error: updateErr } = await adminClient
      .from("lead_call_bookings")
      .update({
        status: "rejected",
        rejection_reason: trimmedReason,
        decided_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    if (updateErr) {
      return { ok: false, error: `DB update failed: ${updateErr.message}` };
    }

    const { ukDateLabel, ukTimeLabel } = formatUkLabels(booking.scheduled_at);
    const hostEmail = process.env.BOOKING_HOST_EMAIL || HOST_EMAIL_FALLBACK;
    await sendBookingRejectedToLead({
      leadName: booking.lead_name,
      leadEmail: booking.lead_email,
      ukDateLabel,
      ukTimeLabel,
      reason: trimmedReason,
      hostEmail,
    });

    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("rejectBookingAction failed:", err);
    return { ok: false, error: msg };
  }
}
