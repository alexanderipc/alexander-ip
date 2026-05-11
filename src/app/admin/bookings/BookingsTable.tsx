"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { approveBookingAction, rejectBookingAction } from "./actions";
import type { BookingRow } from "./page";

const STAGE_LABELS: Record<string, string> = {
  idea: "Just an idea",
  prototype: "Built a prototype / proof of concept",
  filed: "Already filed something",
  unsure: "Not sure",
};

function formatUkDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "booked":
      return { label: "Approved", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case "rejected":
      return { label: "Rejected", cls: "bg-red-100 text-red-800 border-red-200" };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-slate-200 text-slate-700 border-slate-300" };
    case "completed":
      return { label: "Completed", cls: "bg-blue-100 text-blue-800 border-blue-200" };
    case "no_show":
      return { label: "No show", cls: "bg-amber-100 text-amber-800 border-amber-200" };
    default:
      return { label: status, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

export default function BookingsTable({
  pending,
  recent,
}: {
  pending: BookingRow[];
  recent: BookingRow[];
}) {
  return (
    <div className="space-y-10">
      {/* Pending section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending your decision ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
            No pending requests. New ones will appear here as they come in.
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((b) => (
              <PendingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Recent decisions section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Recent decisions
        </h2>
        {recent.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
            Nothing yet.
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Slot</th>
                  <th className="px-4 py-3">Decided</th>
                  <th className="px-4 py-3">Reason / Meet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((b) => {
                  const badge = statusBadge(b.status);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{b.lead_name}</div>
                        <div className="text-xs text-slate-500">{b.lead_email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {formatUkDateTime(b.scheduled_at)} UK
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {b.decided_at ? timeAgo(b.decided_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-md">
                        {b.status === "rejected" && b.rejection_reason ? (
                          <span className="line-clamp-2 italic">
                            &ldquo;{b.rejection_reason}&rdquo;
                          </span>
                        ) : b.google_meet_url ? (
                          <a
                            href={b.google_meet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            Meet link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Pending card with approve/reject actions ──────────────── */

function PendingCard({ booking }: { booking: BookingRow }) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveBookingAction(booking.id);
      if (!res.ok) setError(res.error || "Approve failed.");
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectBookingAction(booking.id, reason);
      if (!res.ok) {
        setError(res.error || "Reject failed.");
      } else {
        setRejectOpen(false);
        setReason("");
      }
    });
  }

  const stageLabel = booking.stage ? STAGE_LABELS[booking.stage] : null;

  return (
    <div className="bg-white border-2 border-amber-200 rounded-lg p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-navy text-base truncate">
              {booking.lead_name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Mail className="w-3 h-3" />
              {booking.lead_email}
            </span>
          </div>
          <div className="text-sm font-medium text-slate-800">
            {formatUkDateTime(booking.scheduled_at)} UK &middot;{" "}
            {booking.duration_minutes ?? 15} min
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Requested {timeAgo(booking.created_at)}
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending || rejectOpen}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending && !rejectOpen ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRejectOpen(!rejectOpen);
            }}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      {/* Stage + topic */}
      <div className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
        {stageLabel && (
          <>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
              Stage
            </div>
            <div className="text-slate-800">{stageLabel}</div>
          </>
        )}
        {booking.topic && (
          <>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
              Topic
            </div>
            <div className="text-slate-800 whitespace-pre-wrap">
              {booking.topic}
            </div>
          </>
        )}
      </div>

      {/* Reject reason input */}
      {rejectOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reason for rejection
            <span className="text-slate-500 font-normal ml-1">
              (shown to the lead verbatim)
            </span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. I only draft patents — I don't help with the engineering / build side of an invention. You'd be better off speaking to a mechanical engineer first."
            disabled={isPending}
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setReason("");
                setError(null);
              }}
              disabled={isPending}
              className="px-3 py-1.5 text-sm rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending || reason.trim().length < 10}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send rejection email
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
