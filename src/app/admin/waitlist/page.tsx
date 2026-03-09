import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import type { ExplorerWaitlistEntry } from "@/lib/supabase/types";

export default async function AdminWaitlistPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: adminProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (adminProfile?.role !== "admin") redirect("/portal");

  const { data: entries } = await adminClient
    .from("explorer_waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  const waitlist = (entries || []) as ExplorerWaitlistEntry[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Explorer Waitlist</h1>
          <p className="text-slate-500 mt-1">
            {waitlist.length} sign-up{waitlist.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {waitlist.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Signed Up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitlist.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-navy">
                      {entry.name}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600">
                      {entry.email}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-slate-400">
                      {new Date(entry.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(entry.created_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            No sign-ups yet. They&apos;ll appear here when people join the
            waitlist from the Portfolio Explorer.
          </p>
        </div>
      )}
    </div>
  );
}
