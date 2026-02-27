import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isComplete } from "@/lib/portal/status";
import ProjectCard from "@/components/portal/ProjectCard";
import { FolderOpen } from "lucide-react";

export default async function PortalDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch all projects for this client
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  const allProjects = projects || [];
  const active = allProjects.filter((p) => !isComplete(p.status));
  const completed = allProjects.filter((p) => isComplete(p.status));

  // Fetch upcoming milestones across all projects
  const projectIds = allProjects.map((p) => p.id);
  const { data: milestones } = projectIds.length
    ? await supabase
        .from("project_milestones")
        .select("*, projects(title)")
        .in("project_id", projectIds)
        .eq("is_client_visible", true)
        .is("completed_date", null)
        .order("target_date", { ascending: true })
        .limit(5)
    : { data: [] };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Your Projects</h1>
        <p className="text-slate-500 mt-1">
          Track progress, view updates, and download documents.
        </p>
      </div>

      {/* Active Projects */}
      {active.length > 0 ? (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Active ({active.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/portal/projects/${project.id}`}
              />
            ))}
          </div>
        </div>
      ) : allProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-navy mb-2">
            No projects yet
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Once Alexander IP creates a project for you, it will appear here.
            You&apos;ll be able to track progress, view documents, and see
            real-time updates.
          </p>
        </div>
      ) : null}

      {/* Upcoming Milestones */}
      {milestones && milestones.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Upcoming Milestones
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{m.title}</p>
                  <p className="text-xs text-slate-400">
                    {(m as Record<string, unknown>).projects
                      ? ((m as Record<string, unknown>).projects as { title: string }).title
                      : ""}
                  </p>
                </div>
                {m.target_date && (
                  <span className="text-sm text-slate-500">
                    {new Date(m.target_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Projects */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Completed ({completed.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/portal/projects/${project.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
