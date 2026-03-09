"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/portal/StatusBadge";

interface CompletedProject {
  id: string;
  title: string;
  service_type: string;
  status: string;
  actual_delivery_date: string | null;
  estimated_delivery_date: string | null;
  profiles: { name: string | null; email: string } | null;
}

interface Props {
  projects: CompletedProject[];
  getServiceLabel: (type: string) => string;
}

export default function CompletedProjects({ projects, getServiceLabel }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (projects.length === 0) return null;

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
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
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
                        {getServiceLabel(p.service_type)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} size="sm" />
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
