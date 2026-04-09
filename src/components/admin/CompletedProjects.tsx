"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/portal/StatusBadge";
import { getServiceLabel } from "@/lib/portal/status";
import { getCurrencySymbol } from "@/lib/pricing";

interface CompletedProject {
  id: string;
  title: string;
  service_type: string;
  status: string;
  project_number: number | null;
  price_paid: number | null;
  currency: string | null;
  actual_delivery_date: string | null;
  estimated_delivery_date: string | null;
  profiles: { name: string | null; email: string } | null;
}

interface Props {
  projects: CompletedProject[];
}

export default function CompletedProjects({ projects }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (projects.length === 0) return null;

  // Sort by completion date, most recent first
  const sorted = [...projects].sort((a, b) => {
    const dateA = a.actual_delivery_date || a.estimated_delivery_date || "";
    const dateB = b.actual_delivery_date || b.estimated_delivery_date || "";
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors group"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>
          {projects.length} completed project{projects.length !== 1 ? "s" : ""}
        </span>
      </button>

      {expanded && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Project
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Client
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Service
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Price
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((p) => {
                const profile = p.profiles as { name: string | null; email: string } | null;
                const completedDate = p.actual_delivery_date || p.estimated_delivery_date;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="text-sm font-medium text-navy hover:text-blue-600 transition-colors"
                      >
                        {p.project_number && (
                          <span className="text-xs text-slate-400 font-normal mr-1">#{p.project_number}</span>
                        )}
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-600">
                        {profile?.name || profile?.email || "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500">
                        {getServiceLabel(p.service_type as Parameters<typeof getServiceLabel>[0])}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.price_paid ? (
                        <span className="text-sm font-medium text-slate-700">
                          {getCurrencySymbol(p.currency || "GBP")}
                          {(p.price_paid / 100).toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-400">
                        {completedDate
                          ? new Date(completedDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "\u2014"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
