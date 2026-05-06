"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTimelineDays, updateDeliveryDate } from "@/app/admin/actions";
import { calculateDeliveryDate } from "@/lib/portal/status";
import { Clock, Save, ChevronDown, CalendarPlus } from "lucide-react";

interface TimelineEditorProps {
  projectId: string;
  startDate: string;
  currentDays: number | null;
  currentDeliveryDate: string | null;
}

type Mode = "extend" | "reset" | "date";

/** Add N days to a YYYY-MM-DD string, returning a new YYYY-MM-DD string. */
function addDays(yyyymmdd: string, n: number): string {
  const [y, m, d] = yyyymmdd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function TimelineEditor({
  projectId,
  startDate,
  currentDays,
  currentDeliveryDate,
}: TimelineEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [extendBy, setExtendBy] = useState("");
  const [days, setDays] = useState(currentDays?.toString() || "");
  const [deliveryDate, setDeliveryDate] = useState(currentDeliveryDate || "");
  // Default to "extend" — the most common admin action ("push deadline by N
  // days"). The legacy "Timeline Days" mode is renamed "Reset from start" to
  // make it clear it doesn't add to the existing date — it overwrites with
  // start + N.
  const [mode, setMode] = useState<Mode>("extend");
  const [saved, setSaved] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [notifyClient, setNotifyClient] = useState(false);

  const extendByNum = parseInt(extendBy);
  const validExtend = !!currentDeliveryDate && Number.isFinite(extendByNum) && extendByNum !== 0;
  const extendedTo = validExtend && currentDeliveryDate
    ? addDays(currentDeliveryDate, extendByNum)
    : null;

  const estimatedFromDays =
    days && parseInt(days) > 0
      ? calculateDeliveryDate(startDate, parseInt(days))
      : null;

  function handleSave() {
    setSaved(false);
    const note = explanation.trim() || undefined;
    // If the admin typed an explanation but didn't tick the box, treat the
    // explanation as the trigger to notify — surfacing it would otherwise be
    // pointless.
    const shouldNotify = notifyClient || !!note;

    startTransition(async () => {
      if (mode === "extend") {
        if (!extendedTo) return;
        // "Extend by N" only changes the delivery date — leaves
        // default_timeline_days untouched, since this isn't a baseline reset.
        await updateDeliveryDate(projectId, extendedTo, note, shouldNotify);
      } else if (mode === "reset") {
        const numDays = days ? parseInt(days) : null;
        await updateTimelineDays(projectId, numDays, note, shouldNotify);
      } else {
        await updateDeliveryDate(projectId, deliveryDate, note, shouldNotify);
      }
      // Re-fetch the page data so the displayed deadline updates in-place.
      // revalidatePath alone only takes effect on the next request, which
      // confused users who saw "Timeline updated" but no change in the UI.
      router.refresh();
      setSaved(true);
      setExtendBy("");
      setExplanation("");
      setNotifyClient(false);
      setShowExplanation(false);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const hasChanged =
    mode === "extend"
      ? validExtend
      : mode === "reset"
      ? days !== (currentDays?.toString() || "")
      : deliveryDate !== (currentDeliveryDate || "");

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setMode("extend")}
          className={`flex-1 text-[11px] py-1.5 rounded-md transition-colors ${
            mode === "extend"
              ? "bg-white text-navy font-medium shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Extend +Days
        </button>
        <button
          type="button"
          onClick={() => setMode("reset")}
          className={`flex-1 text-[11px] py-1.5 rounded-md transition-colors ${
            mode === "reset"
              ? "bg-white text-navy font-medium shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Reset from Start
        </button>
        <button
          type="button"
          onClick={() => setMode("date")}
          className={`flex-1 text-[11px] py-1.5 rounded-md transition-colors ${
            mode === "date"
              ? "bg-white text-navy font-medium shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Specific Date
        </button>
      </div>

      {mode === "extend" ? (
        <div>
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={extendBy}
              onChange={(e) => setExtendBy(e.target.value)}
              placeholder="e.g. 7"
              className="flex-1 px-2 py-1.5 rounded border border-slate-300 text-sm text-navy"
            />
            <span className="text-xs text-slate-500">days</span>
          </div>
          {currentDeliveryDate ? (
            extendedTo ? (
              <p className="text-xs text-slate-500 mt-1.5 ml-6">
                <span className="text-slate-400">{formatDate(currentDeliveryDate)}</span>{" "}
                <span className="text-slate-400">→</span>{" "}
                <strong className="text-navy">{formatDate(extendedTo)}</strong>
                {extendByNum < 0 && (
                  <span className="ml-2 text-amber-600">(earlier)</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5 ml-6">
                Current: {formatDate(currentDeliveryDate)}
              </p>
            )
          ) : (
            <p className="text-xs text-amber-600 mt-1.5 ml-6">
              No current deadline — set one with &ldquo;Specific Date&rdquo; first.
            </p>
          )}
        </div>
      ) : mode === "reset" ? (
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min={1}
              placeholder="e.g. 30"
              className="flex-1 px-2 py-1.5 rounded border border-slate-300 text-sm text-navy"
            />
            <span className="text-xs text-slate-500">days from start</span>
          </div>
          {estimatedFromDays && (
            <p className="text-xs text-slate-400 mt-1.5 ml-6">
              Resets delivery to:{" "}
              {new Date(estimatedFromDays).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1 ml-6 italic">
            Overwrites the deadline as start + N days. Use &ldquo;Extend
            +Days&rdquo; to push an existing deadline forward.
          </p>
        </div>
      ) : (
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm text-navy"
        />
      )}

      {hasChanged && (
        <>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-[11px] text-slate-500 hover:text-navy flex items-center gap-1"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showExplanation ? "rotate-180" : ""
              }`}
            />
            {showExplanation ? "Hide explanation" : "Add explanation & notify client"}
          </button>

          {showExplanation && (
            <div className="space-y-2 border-l-2 border-slate-200 pl-3">
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                placeholder="Why is the deadline changing? Shown to the client."
                className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs text-navy placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={notifyClient || !!explanation.trim()}
                  onChange={(e) => setNotifyClient(e.target.checked)}
                  disabled={!!explanation.trim()}
                  className="rounded border-slate-300"
                />
                Notify client by email
                {explanation.trim() && (
                  <span className="text-[10px] text-slate-400">(auto when explanation set)</span>
                )}
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? "Saving..." : "Update Timeline"}
          </button>
        </>
      )}

      {saved && (
        <p className="text-xs text-green-600 text-center">Timeline updated</p>
      )}
    </div>
  );
}
