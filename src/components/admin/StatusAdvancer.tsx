"use client";

import { useState, useTransition } from "react";
import { advanceStatus } from "@/app/admin/actions";
import { getStatusFlow, getStatusLabel } from "@/lib/portal/status";
import type { ServiceType } from "@/lib/supabase/types";
import { ArrowRight, ChevronDown } from "lucide-react";

interface StatusAdvancerProps {
  projectId: string;
  serviceType: ServiceType;
  currentStatus: string;
  nextStatus: string;
}

export default function StatusAdvancer({
  projectId,
  serviceType,
  currentStatus,
  nextStatus,
}: StatusAdvancerProps) {
  const [isPending, startTransition] = useTransition();
  const [showDetails, setShowDetails] = useState(false);
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);
  const [showTrustpilot, setShowTrustpilot] = useState(false);
  const [targetStatus, setTargetStatus] = useState(nextStatus);

  const flow = getStatusFlow(serviceType);
  const currentIdx = flow.indexOf(currentStatus);
  const futureStages = currentIdx >= 0 ? flow.slice(currentIdx + 1) : [];

  const isSkipping = targetStatus !== nextStatus;
  const isCompleting =
    targetStatus === "complete" || targetStatus === "complete_granted";

  function handleAdvance() {
    if (
      isCompleting &&
      !confirm(
        "Mark this project as complete? The client will be notified and this cannot be easily undone."
      )
    ) {
      return;
    }

    if (
      isSkipping &&
      !confirm(
        `Skip directly to "${getStatusLabel(targetStatus)}"? The client will receive a single notification covering all skipped stages.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      await advanceStatus(
        projectId,
        note || undefined,
        internalNote || undefined,
        notifyClient,
        isCompleting ? showTrustpilot : undefined,
        isSkipping ? targetStatus : undefined
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
          <div className="flex items-center gap-2 flex-wrap text-sm text-blue-600">
            <span>{getStatusLabel(currentStatus)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
            {futureStages.length > 1 ? (
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                disabled={isPending}
                className="font-semibold bg-white border border-blue-200 rounded px-2 py-1 text-sm text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {futureStages.map((s) => (
                  <option key={s} value={s}>
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold">{getStatusLabel(targetStatus)}</span>
            )}
          </div>
          {isSkipping && (
            <p className="text-[11px] text-blue-500 mt-1">
              Skipping {flow.indexOf(targetStatus) - currentIdx - 1} intermediate{" "}
              {flow.indexOf(targetStatus) - currentIdx - 1 === 1 ? "stage" : "stages"} —
              one notification will be sent.
            </p>
          )}
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
            {isPending
              ? "Advancing..."
              : `${isSkipping ? "Skip to" : "Advance to"} ${getStatusLabel(targetStatus)}`}
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

      {isCompleting && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <label className="flex items-center gap-2 text-sm text-green-700">
            <input
              type="checkbox"
              checked={showTrustpilot}
              onChange={(e) => setShowTrustpilot(e.target.checked)}
              className="rounded border-green-300"
            />
            Show Trustpilot review request to client
          </label>
        </div>
      )}
    </div>
  );
}
