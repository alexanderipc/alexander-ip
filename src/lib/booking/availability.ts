/**
 * Slot generation for the free 15-min intro call booking page.
 *
 * Rules (per spec):
 *  - 15-minute slots
 *  - Mon–Fri only (UK time)
 *  - 10:00 to 17:00 UK time (last slot starts 16:45, ends 17:00)
 *  - At least 24 hours in the future
 *  - Surface the next 14 calendar days
 *
 * UK time means Europe/London — BST (UTC+1) in summer, GMT (UTC+0) in winter.
 * We use Intl.DateTimeFormat to resolve the offset for any given instant so
 * BST/GMT transitions are handled automatically.
 */

export const SLOT_DURATION_MINUTES = 15;
export const SLOT_DAY_START_HOUR = 10; // 10:00 UK
export const SLOT_DAY_END_HOUR = 17; // last slot ends at 17:00 → starts at 16:45
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
 *
 * Caller is responsible for further filtering against booked slots.
 */
export function generateCandidateSlots(now: Date = new Date()): Slot[] {
  const minTimeMs = now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000;
  const slots: Slot[] = [];
  const today = ukParts(now);

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

    for (let hour = SLOT_DAY_START_HOUR; hour < SLOT_DAY_END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
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
  }

  return slots;
}

/**
 * Validate a requested slot — must align with our slot grid + meet all constraints.
 * Returns null if valid, or an error string explaining why not.
 */
export function validateSlot(
  startUtcIso: string,
  now: Date = new Date()
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

  // Within working hours
  if (parts.hour < SLOT_DAY_START_HOUR || parts.hour >= SLOT_DAY_END_HOUR) {
    return "Slot must be within UK working hours (10:00–17:00).";
  }

  // Aligned to 15-min boundary
  if (parts.minute % SLOT_DURATION_MINUTES !== 0) {
    return "Slot must align with a 15-minute boundary.";
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
