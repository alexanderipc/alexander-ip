"use client";

import { useState, useTransition } from "react";
import { advanceStatus } from "@/app/admin/actions";
import { getStatusLabel } from "@/lib/portal/status";
import { ArrowRight, ChevronDown } from "lucide-react";

interface StatusAdvancerProps {
  projectId: string;
  currentStatus: string;
  nextStatus: string;
}

export default function StatusAdvancer({
  projectId,
  currentStatus,
  nextStatus,
}: StatusAdvancerProps) {
  const [isPending, startTransition] = useTransition();
  const [showDetails, setShowDetails] = useState(false);
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);

  function handleAdvance() {
    startTransition(async () => {
      await advanceStatus(
        projectId,
        note || undefined,
        internalNote || undefined,
        notifyClient
      );
      setNote("");
      setInternalNote("");
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-blue-800 mb-1">
            Ready to advance?
          </p>
          <p className="text-sm text-blue-600">
            {getStatusLabel(currentStatus)}{" "}
            <ArrowRight className="w-3.5 h-3.5 inline" />{" "}
            <span className="font-semibold">
              {getStatusLabel(nextStatus)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
            />
            {showDetails ? "Hide" : "Add note"}
          </button>
          <button
            onClick={handleAdvance}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Advancing..." : `Advance to ${getStatusLabel(nextStatus)}`}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3 border-t border-blue-200 pt-4">
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              Client-visible note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional update shown to the client..."
              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              Internal note (admin only)
            </label>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={1}
              placeholder="Private note..."
              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-blue-700">
            <input
              type="checkbox"
              checked={notifyClient}
              onChange={(e) => setNotifyClient(e.target.checked)}
              className="rounded border-blue-300"
            />
            Notify client by email
          </label>
        </div>
      )}
    </div>
  );
}
