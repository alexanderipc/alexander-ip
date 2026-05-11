/**
 * Pseudo-busy filter for the free intro-call slot picker.
 *
 * The goal is purely presentational: we don't want the picker to look empty,
 * because rows of completely-free slots signal "this guy has no clients".
 * So we hide a percentage of real-free slots, weighted toward times Alex
 * would prefer to *not* take free 15-min calls anyway (mornings and the
 * start of the week), leaving the picker looking busy-but-bookable.
 *
 * This is deterministic per (ukDate, ukTime) — same slot is hidden across
 * every page load for the day it falls in, but the pattern rotates daily.
 *
 * Important: only applied to the free /book-call flow. Paid consultations
 * (/book-consultation) always show real availability.
 */

import type { Slot } from "@/lib/booking/availability";
import { ukParts } from "@/lib/booking/availability";

/**
 * Probability (out of 100) that a slot is pseudo-busy. Higher = more often hidden.
 *
 *  Mon/Tue mornings — very busy
 *  Mon/Tue afternoons — busy
 *  Wed/Thu mornings — moderately busy
 *  Wed/Thu afternoons — light
 *  Fri mornings — moderate
 *  Fri afternoons — light
 */
function busyThreshold(weekday: number, hour: number): number {
  const isMorning = hour < 12;
  const isMonOrTue = weekday === 1 || weekday === 2;
  const isWedOrThu = weekday === 3 || weekday === 4;
  const isFri = weekday === 5;

  if (isMonOrTue && isMorning) return 90;
  if (isMonOrTue) return 65;
  if (isWedOrThu && isMorning) return 70;
  if (isWedOrThu) return 40;
  if (isFri && isMorning) return 55;
  if (isFri) return 25;
  return 0;
}

/** djb2 hash → 0..99, stable across runs. */
function hashToBucket(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100;
}

/**
 * Return true if this slot should appear "busy" to visitors.
 * The decision is stable across reloads.
 */
export function isPseudoBusy(slot: Slot): boolean {
  const date = new Date(slot.startUtc);
  const parts = ukParts(date);
  const threshold = busyThreshold(parts.weekday, parts.hour);
  if (threshold === 0) return false;
  const bucket = hashToBucket(`${slot.ukDate}|${slot.ukTime}`);
  return bucket < threshold;
}

/**
 * Filter a slot list down, hiding pseudo-busy slots — but always leave
 * `minPerDay` slots per UK calendar day visible so no day collapses to zero.
 * Slots restored to meet the minimum are taken from the latest (afternoon)
 * end of the day, because Alex prefers afternoon calls anyway.
 */
export function applyPseudoBusy(
  slots: Slot[],
  minPerDay = 2
): Slot[] {
  if (slots.length === 0) return slots;

  // Bucket slots by day
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const list = byDay.get(s.ukDate) ?? [];
    list.push(s);
    byDay.set(s.ukDate, list);
  }

  const out: Slot[] = [];
  for (const [, daySlots] of byDay) {
    const sorted = [...daySlots].sort((a, b) => a.ukTime.localeCompare(b.ukTime));
    const survivors = sorted.filter((s) => !isPseudoBusy(s));

    if (survivors.length >= minPerDay) {
      out.push(...survivors);
      continue;
    }

    // Need to restore some. Take the latest-afternoon slots that we hid.
    const hidden = sorted.filter((s) => isPseudoBusy(s));
    const needed = minPerDay - survivors.length;
    // hidden is in ascending order; take from the END (afternoon)
    const restored = hidden.slice(-needed);
    out.push(
      ...[...survivors, ...restored].sort((a, b) =>
        a.ukTime.localeCompare(b.ukTime)
      )
    );
  }

  // Preserve original ordering (by startUtc, since slots come in chronological order)
  return out.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}
