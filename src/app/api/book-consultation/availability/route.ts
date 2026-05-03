import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateCandidateSlots,
  PAID_CONSULTATION_DURATION_MINUTES,
} from "@/lib/booking/availability";
import { getBusyWindows } from "@/lib/booking/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/book-consultation/availability
 * Returns a JSON array of free 60-min slots for the next 14 days.
 *
 * A slot is unavailable if any of these overlap it:
 *  - a paid consultation booking (status='paid')
 *  - a pending consultation booking still inside its hold window (pending_until > now)
 *  - a free 15-min call booking (lead_call_bookings, status='booked')
 *  - a busy window from the host's Google Calendar
 */
export async function GET() {
  try {
    const now = new Date();
    const candidates = generateCandidateSlots(
      now,
      PAID_CONSULTATION_DURATION_MINUTES
    );
    if (candidates.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Time window for both DB and Google freeBusy queries
    const startUtc = new Date(candidates[0].startUtc);
    const lastSlot = new Date(candidates[candidates.length - 1].startUtc);
    const endUtc = new Date(
      lastSlot.getTime() + PAID_CONSULTATION_DURATION_MINUTES * 60 * 1000
    );

    const adminClient = createAdminClient();

    // Pull blocked windows from both booking tables.
    const [{ data: paidRows }, { data: pendingRows }, { data: freeRows }] =
      await Promise.all([
        adminClient
          .from("paid_consultation_bookings")
          .select("scheduled_at, duration_minutes")
          .eq("status", "paid")
          .gte("scheduled_at", startUtc.toISOString())
          .lte("scheduled_at", endUtc.toISOString()),
        adminClient
          .from("paid_consultation_bookings")
          .select("scheduled_at, duration_minutes")
          .eq("status", "pending")
          .gt("pending_until", now.toISOString())
          .gte("scheduled_at", startUtc.toISOString())
          .lte("scheduled_at", endUtc.toISOString()),
        adminClient
          .from("lead_call_bookings")
          .select("scheduled_at, duration_minutes")
          .eq("status", "booked")
          .gte("scheduled_at", startUtc.toISOString())
          .lte("scheduled_at", endUtc.toISOString()),
      ]);

    type Window = { start: number; end: number };
    const blocked: Window[] = [];
    for (const row of [
      ...(paidRows ?? []),
      ...(pendingRows ?? []),
      ...(freeRows ?? []),
    ]) {
      const s = new Date(row.scheduled_at).getTime();
      const dur = (row.duration_minutes ?? 60) * 60 * 1000;
      blocked.push({ start: s, end: s + dur });
    }

    // Pull busy windows from Google Calendar (returns [] if not configured)
    let busyWindows: { startUtc: string; endUtc: string }[] = [];
    try {
      busyWindows = await getBusyWindows(startUtc, endUtc);
    } catch (err) {
      console.error(
        "[book-consultation] freeBusy error (continuing without):",
        err
      );
    }
    for (const b of busyWindows) {
      blocked.push({
        start: new Date(b.startUtc).getTime(),
        end: new Date(b.endUtc).getTime(),
      });
    }

    const slotMs = PAID_CONSULTATION_DURATION_MINUTES * 60 * 1000;
    const slots = candidates.filter((slot) => {
      const slotStart = new Date(slot.startUtc).getTime();
      const slotEnd = slotStart + slotMs;
      for (const b of blocked) {
        if (slotStart < b.end && slotEnd > b.start) return false; // overlap
      }
      return true;
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Consultation availability error:", err);
    return NextResponse.json(
      { error: "Could not load availability." },
      { status: 500 }
    );
  }
}
