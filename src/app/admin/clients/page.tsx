import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (adminProfile?.role !== "admin") redirect("/portal");

  // Fetch all client profiles with project counts
  const { data: clients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  // Get project counts per client
  const clientIds = (clients || []).map((c) => c.id);
  const { data: projects } = clientIds.length
    ? await supabase
        .from("projects")
        .select("client_id")
        .in("client_id", clientIds)
    : { data: [] };

  const projectCounts: Record<string, number> = {};
  (projects || []).forEach((p) => {
    projectCounts[p.client_id] = (projectCounts[p.client_id] || 0) + 1;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Clients</h1>
          <p className="text-slate-500 mt-1">
            {(clients || []).length} client
            {(clients || []).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {(clients || []).length > 0 ? (
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
                  Company
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Projects
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Joined
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(clients || []).map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-navy">
                      {client.name || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600">
                      {client.email || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-500">
                      {client.company || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600">
                      {projectCounts[client.id] || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-slate-400">
                      {new Date(client.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            No clients yet. They&apos;ll appear here when you create projects.
          </p>
        </div>
      )}
    </div>
  );
}
