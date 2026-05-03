/**
 * Slot generation for booking pages.
 *
 * Generic over slot duration so it can power both:
 *  - the free 15-min intro call page (/book-call) and
 *  - the paid 1-hour consultation page (/book-consultation).
 *
 * Rules (shared):
 *  - Mon–Fri only (UK time)
 *  - 10:00 to 17:00 UK time (last slot ends at 17:00)
 *  - At least 24 hours in the future
 *  - Surface the next 14 calendar days
 *
 * UK time means Europe/London — BST (UTC+1) in summer, GMT (UTC+0) in winter.
 * We use Intl.DateTimeFormat to resolve the offset for any given instant so
 * BST/GMT transitions are handled automatically.
 */

/** @deprecated Use the duration param explicitly. Kept as the free-call default. */
export const SLOT_DURATION_MINUTES = 15;
export const FREE_CALL_DURATION_MINUTES = 15;
export const PAID_CONSULTATION_DURATION_MINUTES = 60;
export const SLOT_DAY_START_HOUR = 10; // 10:00 UK
export const SLOT_DAY_END_HOUR = 17; // last slot ends at 17:00
export const MIN_LEAD_HOURS = 24;
export const DAYS_AHEAD = 14;
export const UK_TZ = "Europe/London";

export interface Slot {
  /** ISO timestamp (UTC) when the slot starts */
  startUtc: string;
  /** UK calendar date as YYYY-MM-DD */
  ukDate: string;
  /** UK wall-clock time HH:MM (24h) */
  ukTime: string;
}

/** Date components in a specific timezone. */
interface ZonedDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0=Sun ... 6=Sat
}

const PART_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Get the UK calendar parts for a UTC instant. */
export function ukParts(utc: Date): ZonedDateParts {
  const parts = PART_FORMATTER.formatToParts(utc);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  // Intl returns "24" for midnight in some browsers — normalise
  const hour = parseInt(get("hour"), 10) % 24;
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour,
    minute: parseInt(get("minute"), 10),
    second: parseInt(get("second"), 10),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/**
 * Convert a UK wall-clock time to a UTC Date.
 * Handles BST/GMT transitions correctly via two-step probe.
 */
export function ukWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  // First guess: treat the wall-clock as UTC
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  const guessAsDate = new Date(guessUtcMs);
  // What does that instant look like in UK time?
  const ukOfGuess = ukParts(guessAsDate);
  const ukOfGuessMs = Date.UTC(
    ukOfGuess.year,
    ukOfGuess.month - 1,
    ukOfGuess.day,
    ukOfGuess.hour,
    ukOfGuess.minute,
    ukOfGuess.second
  );
  const offsetMs = ukOfGuessMs - guessUtcMs;
  return new Date(guessUtcMs - offsetMs);
}

/** Pad a number to 2 digits */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format a UK calendar date as YYYY-MM-DD */
function formatUkDate(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/** Format a UK wall-clock time as HH:MM */
function formatUkTime(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/**
 * Generate every candidate slot in the booking window, filtered to:
 * - Future ≥ MIN_LEAD_HOURS
 * - Mon–Fri UK time
 * - Within 10:00–17:00 UK time
 * - The slot must end on/before SLOT_DAY_END_HOUR (so a 60-min slot at 17:00
 *   would NOT be generated; the last 60-min slot of the day starts at 16:00)
 *
 * Caller is responsible for further filtering against booked slots.
 *
 * @param durationMinutes — slot length (also the stride between starts).
 *                          15 for free intro calls, 60 for paid consultations.
 */
export function generateCandidateSlots(
  now: Date = new Date(),
  durationMinutes: number = FREE_CALL_DURATION_MINUTES
): Slot[] {
  const minTimeMs = now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000;
  const slots: Slot[] = [];
  const today = ukParts(now);
  const dayEndMinutes = SLOT_DAY_END_HOUR * 60;

  // Start from today's UK date and iterate forward
  for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
    // Compute the UK calendar date by adding days to today.
    // Use a noon UTC anchor to avoid BST-transition midnight ambiguity.
    const anchorUtc = ukWallClockToUtc(
      today.year,
      today.month,
      today.day + dayOffset,
      12,
      0
    );
    const dayParts = ukParts(anchorUtc);

    // Skip weekends
    if (dayParts.weekday === 0 || dayParts.weekday === 6) continue;

    // Walk minute-of-day in `durationMinutes` strides; require slot to END
    // on or before SLOT_DAY_END_HOUR.
    const dayStartMinutes = SLOT_DAY_START_HOUR * 60;
    for (
      let m = dayStartMinutes;
      m + durationMinutes <= dayEndMinutes;
      m += durationMinutes
    ) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      const slotUtc = ukWallClockToUtc(
        dayParts.year,
        dayParts.month,
        dayParts.day,
        hour,
        minute
      );
      if (slotUtc.getTime() < minTimeMs) continue;

      slots.push({
        startUtc: slotUtc.toISOString(),
        ukDate: formatUkDate(dayParts),
        ukTime: formatUkTime(hour, minute),
      });
    }
  }

  return slots;
}

/**
 * Validate a requested slot — must align with our slot grid + meet all
 * constraints for the given duration.
 *
 * Returns null if valid, or an error string explaining why not.
 *
 * @param durationMinutes — slot length used both as the stride and to enforce
 *                          that the slot ends on/before SLOT_DAY_END_HOUR.
 */
export function validateSlot(
  startUtcIso: string,
  now: Date = new Date(),
  durationMinutes: number = FREE_CALL_DURATION_MINUTES
): string | null {
  const slot = new Date(startUtcIso);
  if (isNaN(slot.getTime())) return "Invalid slot timestamp.";

  // ≥ 24h in the future
  if (slot.getTime() < now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000) {
    return "Slot must be at least 24 hours in the future.";
  }

  // ≤ 14 days ahead (small buffer)
  const maxFuture = now.getTime() + (DAYS_AHEAD + 1) * 24 * 60 * 60 * 1000;
  if (slot.getTime() > maxFuture) {
    return "Slot is too far in the future.";
  }

  const parts = ukParts(slot);

  // Weekday only
  if (parts.weekday === 0 || parts.weekday === 6) {
    return "Slot must be a UK weekday.";
  }

  // Slot must start within working hours and END by SLOT_DAY_END_HOUR.
  const startMinutesOfDay = parts.hour * 60 + parts.minute;
  const endMinutesOfDay = startMinutesOfDay + durationMinutes;
  if (
    startMinutesOfDay < SLOT_DAY_START_HOUR * 60 ||
    endMinutesOfDay > SLOT_DAY_END_HOUR * 60
  ) {
    return `Slot must start at or after 10:00 UK and end by 17:00 UK.`;
  }

  // Aligned to a duration boundary from 10:00.
  const offsetFromDayStart = startMinutesOfDay - SLOT_DAY_START_HOUR * 60;
  if (offsetFromDayStart % durationMinutes !== 0) {
    return `Slot must align with a ${durationMinutes}-minute boundary.`;
  }

  if (parts.second !== 0) {
    return "Slot must be on the minute.";
  }

  return null;
}

/** Group slots by their UK calendar date for the picker UI. */
export function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const grouped: Record<string, Slot[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.ukDate]) grouped[slot.ukDate] = [];
    grouped[slot.ukDate].push(slot);
  }
  return grouped;
}
