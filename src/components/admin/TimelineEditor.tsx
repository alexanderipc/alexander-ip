"use client";

import { useState, useTransition } from "react";
import { updateTimelineDays, updateDeliveryDate } from "@/app/admin/actions";
import { calculateDeliveryDate } from "@/lib/portal/status";
import { Clock, Save } from "lucide-react";

interface TimelineEditorProps {
  projectId: string;
  startDate: string;
  currentDays: number | null;
  currentDeliveryDate: string | null;
}

export default function TimelineEditor({
  projectId,
  startDate,
  currentDays,
  currentDeliveryDate,
}: TimelineEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [days, setDays] = useState(currentDays?.toString() || "");
  const [deliveryDate, setDeliveryDate] = useState(currentDeliveryDate || "");
  const [mode, setMode] = useState<"days" | "date">("days");
  const [saved, setSaved] = useState(false);

  const estimatedFromDays =
    days && parseInt(days) > 0
      ? calculateDeliveryDate(startDate, parseInt(days))
      : null;

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      if (mode === "days") {
        const numDays = days ? parseInt(days) : null;
        await updateTimelineDays(projectId, numDays);
      } else {
        await updateDeliveryDate(projectId, deliveryDate);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const hasChanged =
    mode === "days"
      ? days !== (currentDays?.toString() || "")
      : deliveryDate !== (currentDeliveryDate || "");

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setMode("days")}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
            mode === "days"
              ? "bg-white text-navy font-medium shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Timeline Days
        </button>
        <button
          type="button"
          onClick={() => setMode("date")}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
            mode === "date"
              ? "bg-white text-navy font-medium shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Specific Date
        </button>
      </div>

      {mode === "days" ? (
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
            <span className="text-xs text-slate-500">days</span>
          </div>
          {estimatedFromDays && (
            <p className="text-xs text-slate-400 mt-1.5 ml-6">
              Est. delivery:{" "}
              {new Date(estimatedFromDays).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
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
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {isPending ? "Saving..." : "Update Timeline"}
        </button>
      )}

      {saved && (
        <p className="text-xs text-green-600 text-center">Timeline updated</p>
      )}
    </div>
  );
}
