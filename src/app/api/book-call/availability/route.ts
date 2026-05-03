import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCandidateSlots } from "@/lib/booking/availability";
import { getBusyWindows } from "@/lib/booking/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/book-call/availability
 * Returns a JSON array of free 15-min slots for the next 14 days.
 *
 * Filters out:
 *  - slots already booked in our DB (lead_call_bookings)
 *  - slots that overlap host's Google Calendar busy windows (if configured)
 */
export async function GET() {
  try {
    const now = new Date();
    const candidates = generateCandidateSlots(now);
    if (candidates.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Time window for both DB and Google freeBusy queries
    const startUtc = new Date(candidates[0].startUtc);
    const lastSlot = new Date(candidates[candidates.length - 1].startUtc);
    const endUtc = new Date(lastSlot.getTime() + 60 * 60 * 1000);

    const adminClient = createAdminClient();
    const consultLookback = new Date(startUtc.getTime() - 60 * 60 * 1000);

    // 1. Pull existing bookings from BOTH tables in parallel:
    //    - free 15-min calls already booked
    //    - paid consultations (active OR pending-still-held) — they're an
    //      hour long, so any 15-min slot inside that hour must be blocked
    const [
      { data: bookedRows, error: bookedErr },
      { data: paidConsults },
      { data: pendingConsults },
    ] = await Promise.all([
      adminClient
        .from("lead_call_bookings")
        .select("scheduled_at")
        .eq("status", "booked")
        .gte("scheduled_at", startUtc.toISOString())
        .lte("scheduled_at", endUtc.toISOString()),
      adminClient
        .from("paid_consultation_bookings")
        .select("scheduled_at, duration_minutes")
        .eq("status", "paid")
        .gte("scheduled_at", consultLookback.toISOString())
        .lte("scheduled_at", endUtc.toISOString()),
      adminClient
        .from("paid_consultation_bookings")
        .select("scheduled_at, duration_minutes")
        .eq("status", "pending")
        .gt("pending_until", now.toISOString())
        .gte("scheduled_at", consultLookback.toISOString())
        .lte("scheduled_at", endUtc.toISOString()),
    ]);

    if (bookedErr) {
      console.error("[booking] Failed to read bookings:", bookedErr.message);
    }
    const bookedSet = new Set(
      (bookedRows ?? []).map((r) => new Date(r.scheduled_at).getTime())
    );
    const consultationWindows = [
      ...(paidConsults ?? []),
      ...(pendingConsults ?? []),
    ].map((r) => {
      const s = new Date(r.scheduled_at).getTime();
      const dur = (r.duration_minutes ?? 60) * 60 * 1000;
      return { start: s, end: s + dur };
    });

    // 2. Pull busy windows from Google Calendar (returns [] if not configured)
    let busyWindows: { startUtc: string; endUtc: string }[] = [];
    try {
      busyWindows = await getBusyWindows(startUtc, endUtc);
    } catch (err) {
      console.error("[booking] freeBusy error (continuing without):", err);
    }
    const busyMs = busyWindows.map((b) => ({
      start: new Date(b.startUtc).getTime(),
      end: new Date(b.endUtc).getTime(),
    }));

    // 3. Filter: not exact-match booked, not inside any consultation window,
    //    not inside a Google busy window.
    const slots = candidates.filter((slot) => {
      const slotStart = new Date(slot.startUtc).getTime();
      const slotEnd = slotStart + 15 * 60 * 1000;
      if (bookedSet.has(slotStart)) return false;
      for (const w of consultationWindows) {
        if (slotStart < w.end && slotEnd > w.start) return false;
      }
      for (const b of busyMs) {
        if (slotStart < b.end && slotEnd > b.start) return false;
      }
      return true;
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json(
      { error: "Could not load availability." },
      { status: 500 }
    );
  }
}
