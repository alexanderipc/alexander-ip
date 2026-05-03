"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar, Clock } from "lucide-react";
import Button from "@/components/ui/Button";

interface Slot {
  startUtc: string;
  ukDate: string;
  ukTime: string;
}

type Stage = "idea" | "prototype" | "filed" | "unsure";

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: "idea", label: "Just an idea" },
  { value: "prototype", label: "Built a prototype / proof of concept" },
  { value: "filed", label: "Already filed something" },
  { value: "unsure", label: "Not sure" },
];

function formatDateLabel(ukDate: string): string {
  const [year, month, day] = ukDate.split("-").map((n) => parseInt(n, 10));
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(anchor);
}

function formatLongDateLabel(ukDate: string): string {
  const [year, month, day] = ukDate.split("-").map((n) => parseInt(n, 10));
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(anchor);
}

function formatLocalTimeLabel(startUtc: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(startUtc));
}

function tzShortName(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch {
    return tz;
  }
}

export default function BookConsultationForm() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage | "">("");
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Visitor's IANA tz for showing local time alongside UK time.
  const [visitorTz, setVisitorTz] = useState<string>("");
  useEffect(() => {
    try {
      setVisitorTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    } catch {
      // ignore
    }
  }, []);
  const showLocalTimes =
    visitorTz !== "" &&
    visitorTz !== "Europe/London" &&
    visitorTz !== "Europe/Belfast";
  const visitorTzShort = showLocalTimes ? tzShortName(visitorTz) : "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/book-consultation/availability", {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data.slots)) {
          setLoadError(
            data?.error || "Couldn't load available times. Please refresh."
          );
        } else {
          setSlots(data.slots);
          if (data.slots.length > 0) setSelectedDate(data.slots[0].ukDate);
        }
      } catch {
        if (!cancelled) setLoadError("Network error loading availability.");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, Slot[]> = {};
    for (const s of slots ?? []) {
      if (!grouped[s.ukDate]) grouped[s.ukDate] = [];
      grouped[s.ukDate].push(s);
    }
    return grouped;
  }, [slots]);

  const datesAvailable = useMemo(
    () => Object.keys(slotsByDate).sort(),
    [slotsByDate]
  );

  async function handleSubmit() {
    if (!selectedSlot) {
      setSubmitError("Please pick a time slot.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setSubmitError("Name and email are required.");
      return;
    }
    if (!stage) {
      setSubmitError(
        "Please tell me where you're at — even a rough answer helps me prep."
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/book-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          stage,
          topic: topic.trim() || undefined,
          startUtc: selectedSlot.startUtc,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        // Redirect straight to Stripe Checkout
        window.location.href = data.url as string;
        return;
      }
      if (res.status === 409) {
        setSubmitError(
          data?.error || "That slot was just taken. Please pick another."
        );
        setSlots((prev) =>
          prev
            ? prev.filter((s) => s.startUtc !== selectedSlot.startUtc)
            : prev
        );
        setSelectedSlot(null);
      } else {
        setSubmitError(data?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingSlots) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 max-w-3xl mx-auto text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading available times&hellip;</p>
      </div>
    );
  }

  if (loadError || (slots && slots.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-navy mb-2">
          No slots available
        </h2>
        <p className="text-slate-600 mb-6">
          {loadError ||
            "It looks like every consultation slot in the next two weeks is taken. Send me an email and I'll find time for you."}
        </p>
        <Button href="mailto:alexanderip.contact@gmail.com">
          Email me directly
        </Button>
      </div>
    );
  }

  const dateSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Date picker */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          1. Pick a day
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {datesAvailable.map((d) => {
            const isSelected = d === selectedDate;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {formatDateLabel(d)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot picker */}
      {selectedDate && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            2. Pick a time &mdash; {formatLongDateLabel(selectedDate)}
          </h3>
          {showLocalTimes && (
            <p className="text-xs text-slate-500 mb-3">
              Times shown as <strong className="text-navy">UK</strong> /{" "}
              <strong className="text-navy">{visitorTzShort}</strong> (your
              local). Each slot is a full hour during UK business hours.
            </p>
          )}
          <div
            className={`grid gap-2 ${
              showLocalTimes
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
            }`}
          >
            {dateSlots.map((slot) => {
              const isSelected = selectedSlot?.startUtc === slot.startUtc;
              const localTime = showLocalTimes
                ? formatLocalTimeLabel(slot.startUtc, visitorTz)
                : null;
              return (
                <button
                  key={slot.startUtc}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-2 py-2 rounded-lg border-2 transition-all text-sm font-mono ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {showLocalTimes ? (
                    <span className="flex flex-col leading-tight">
                      <span>
                        {slot.ukTime}
                        <span className="text-[10px] text-slate-400 ml-1">
                          UK
                        </span>
                      </span>
                      <span className="text-xs">
                        {localTime}
                        <span className="text-[10px] text-slate-400 ml-1">
                          {visitorTzShort}
                        </span>
                      </span>
                    </span>
                  ) : (
                    slot.ukTime
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Details form */}
      {selectedSlot && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
            3. Your details
          </h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Your name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                disabled={submitting}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                The Google Meet invite + receipt will be sent here.
              </p>
            </div>
            <div>
              <label
                htmlFor="stage"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Where are you at with this?
              </label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage | "")}
                disabled={submitting}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select one&hellip;</option>
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                So I know what to focus on.
              </p>
            </div>
            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                What would you like to discuss?{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="topic"
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="A sentence or two about the invention, or what you're hoping to get out of the consultation."
                disabled={submitting}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 px-4 py-2 rounded-lg">
              {submitError}
            </p>
          )}

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500">
              <strong className="text-navy">
                {formatLongDateLabel(selectedSlot.ukDate)}
              </strong>{" "}
              at{" "}
              <strong className="text-navy">{selectedSlot.ukTime}</strong> UK
              {showLocalTimes && (
                <>
                  {" "}/{" "}
                  <strong className="text-navy">
                    {formatLocalTimeLabel(selectedSlot.startUtc, visitorTz)}
                  </strong>{" "}
                  {visitorTzShort}
                </>
              )}
            </p>
            <Button onClick={handleSubmit} disabled={submitting} size="md">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting&hellip;
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Slot is held for 30 minutes while you complete payment. Full refund
            if I can&rsquo;t provide value.
          </p>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center mt-6">
        {showLocalTimes ? (
          <>
            Times shown in UK time and your local time ({visitorTzShort}). Slots
            are 60 minutes during UK business hours.
          </>
        ) : (
          <>
            All times shown in UK time (Europe/London). Slots are 60 minutes.
          </>
        )}
      </p>
    </div>
  );
}
