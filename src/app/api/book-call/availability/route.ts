import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCandidateSlots } from "@/lib/booking/availability";
import { getBusyWindows } from "@/lib/booking/google-calendar";
import { applyPseudoBusy } from "@/lib/booking/pseudo-busy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/book-call/availability
 * Returns a JSON array of free 15-min slots for the next 14 days.
 *
 * Filters out:
 *  - slots already booked in our DB (lead_call_bookings)
 *  - slots that overlap host's Google Calendar busy windows (if configured)
 *
 * Presentational filter:
 *  - For anonymous visitors we hide a percentage of real-free slots so the
 *    picker doesn't look empty (see pseudo-busy.ts).
 *  - For paying clients — i.e. users authenticated to /portal whose email
 *    appears in paid_consultation_bookings — we skip that filter and return
 *    real availability. They've paid; they shouldn't be fed a fake calendar.
 *  - Admins always see real availability (for testing).
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
        .in("status", ["pending", "booked"])
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

    // 3. Filter: not exact-match booked/pending, not inside any consultation
    //    window, not inside a Google busy window.
    const realFree = candidates.filter((slot) => {
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

    // 4. Decide whether to apply the pseudo-busy filter. We skip it for
    //    paying clients (so they see real availability) and for admins.
    let bypassPseudoBusy = false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        // Admin check via profiles (one round trip, cheap)
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin") {
          bypassPseudoBusy = true;
        } else {
          // Paying-client check: any successful paid consultation under this email
          const { data: paidRow } = await adminClient
            .from("paid_consultation_bookings")
            .select("id")
            .eq("lead_email", user.email.toLowerCase())
            .eq("status", "paid")
            .limit(1)
            .maybeSingle();
          if (paidRow) bypassPseudoBusy = true;
        }
      }
    } catch (err) {
      // Auth check is best-effort; on failure, fall back to the public view.
      console.error("[booking] auth check failed (using public view):", err);
    }

    const slots = bypassPseudoBusy ? realFree : applyPseudoBusy(realFree);

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json(
      { error: "Could not load availability." },
      { status: 500 }
    );
  }
}
