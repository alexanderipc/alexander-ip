import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProjectCard from "@/components/portal/ProjectCard";
import { ArrowLeft, Mail, Building, Phone } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
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

  // Fetch client profile
  const { data: client, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) notFound();

  // Fetch their projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-navy mb-4">
          {client.name || "Unnamed Client"}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          {client.company && (
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              {client.company}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              {client.phone}
            </div>
          )}
        </div>
        {client.notes && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
            <span className="font-medium">Notes: </span>
            {client.notes}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-4">
          Client since{" "}
          {new Date(client.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Projects */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Projects ({(projects || []).length})
      </h2>
      {(projects || []).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(projects || []).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              href={`/admin/projects/${project.id}`}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">
          No projects for this client yet.
        </p>
      )}
    </div>
  );
}
