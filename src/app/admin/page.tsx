import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getServiceLabel,
  getStatusLabel,
  getDaysRemaining,
  isComplete,
} from "@/lib/portal/status";
import DeadlineIndicator from "@/components/admin/DeadlineIndicator";
import StatusBadge from "@/components/portal/StatusBadge";
import { Plus, AlertTriangle, Clock, FolderOpen, MessageCircle, CalendarDays } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all projects with client info
  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(name, email)")
    .order("estimated_delivery_date", { ascending: true });

  const all = projects || [];
  const active = all.filter((p) => !isComplete(p.status));

  // Fetch unread client messages (is_admin = false, unread)
  const activeIds = active.map((p) => p.id);
  let unreadMsgs: Array<{ project_id: string }> = [];
  try {
    const result = activeIds.length
      ? await supabase
          .from("project_messages")
          .select("project_id")
          .in("project_id", activeIds)
          .eq("is_admin", false)
          .is("read_at", null)
      : { data: [] };
    unreadMsgs = (result.data as Array<{ project_id: string }>) || [];
  } catch {
    unreadMsgs = [];
  }
  const unreadMap: Record<string, number> = {};
  unreadMsgs.forEach((m) => {
    unreadMap[m.project_id] = (unreadMap[m.project_id] || 0) + 1;
  });
  const overdue = active.filter(
    (p) =>
      p.estimated_delivery_date &&
      getDaysRemaining(p.estimated_delivery_date) < 0
  );
  const dueSoon = active.filter(
    (p) =>
      p.estimated_delivery_date &&
      getDaysRemaining(p.estimated_delivery_date) >= 0 &&
      getDaysRemaining(p.estimated_delivery_date) <= 7
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {active.length} active project{active.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/calendar"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </Link>
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div className="flex gap-4 mb-6">
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {overdue.length} project{overdue.length !== 1 ? "s" : ""} overdue
            </div>
          )}
          {dueSoon.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <Clock className="w-4 h-4" />
              {dueSoon.length} due within 7 days
            </div>
          )}
        </div>
      )}

      {/* Projects table */}
      {active.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8 overflow-x-auto">
          <table className="w-full min-w-[640px]">
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
                  Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {active.map((p) => {
                const profile = p.profiles as unknown as {
                  name: string | null;
                  email: string;
                } | null;
                const urgency =
                  p.estimated_delivery_date &&
                  getDaysRemaining(p.estimated_delivery_date) < 0
                    ? "overdue"
                    : p.estimated_delivery_date &&
                      getDaysRemaining(p.estimated_delivery_date) <= 7
                    ? "urgent"
                    : "normal";

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      urgency === "overdue"
                        ? "bg-red-50/50"
                        : urgency === "urgent"
                        ? "bg-amber-50/30"
                        : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/projects/${p.id}`}
                        className="text-sm font-medium text-navy hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                      >
                        {p.title}
                        {(unreadMap[p.id] || 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            <MessageCircle className="w-2.5 h-2.5" />
                            {unreadMap[p.id]}
                          </span>
                        )}
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
                      <DeadlineIndicator
                        deliveryDate={p.estimated_delivery_date}
                        status={p.status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-navy mb-2">
            No active projects
          </h2>
          <p className="text-slate-500 mb-4">
            Create your first project to get started.
          </p>
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      )}

      {/* Completed summary */}
      {all.filter((p) => isComplete(p.status)).length > 0 && (
        <div className="text-sm text-slate-400">
          {all.filter((p) => isComplete(p.status)).length} completed project
          {all.filter((p) => isComplete(p.status)).length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
