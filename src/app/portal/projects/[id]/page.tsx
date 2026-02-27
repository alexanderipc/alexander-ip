import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getServiceLabel,
  getProgressPercent,
  getDaysRemaining,
  isComplete,
} from "@/lib/portal/status";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/portal/StatusBadge";
import ProgressBar from "@/components/portal/ProgressBar";
import ProjectTimeline from "@/components/portal/ProjectTimeline";
import UpdatesFeed from "@/components/portal/UpdatesFeed";
import DocumentsList from "@/components/portal/DocumentsList";
import MilestonesList from "@/components/portal/MilestonesList";
import { ArrowLeft, Calendar, Globe, Clock } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch project (RLS ensures only the client's own projects are visible)
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  // Fetch related data in parallel
  const [updatesResult, docsResult, milestonesResult] = await Promise.all([
    supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", id)
      .eq("client_visible", true)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", id)
      .eq("is_client_visible", true)
      .order("target_date", { ascending: true }),
  ]);

  const updates = updatesResult.data || [];
  const documents = docsResult.data || [];
  const milestones = milestonesResult.data || [];

  const percent = getProgressPercent(project.service_type, project.status);
  const complete = isComplete(project.status);
  const daysLeft = project.estimated_delivery_date
    ? getDaysRemaining(project.estimated_delivery_date)
    : null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">
              {getServiceLabel(project.service_type)}
            </p>
            <h1 className="text-2xl font-bold text-navy">{project.title}</h1>
            {project.description && (
              <p className="text-slate-500 mt-1">{project.description}</p>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Progress</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>

        {/* Key info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {project.start_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Started{" "}
                {new Date(project.start_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {!complete && project.estimated_delivery_date && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Est. delivery{" "}
                {new Date(project.estimated_delivery_date).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" }
                )}
                {daysLeft !== null && daysLeft > 0 && (
                  <span className="text-slate-400 ml-1">
                    ({daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining)
                  </span>
                )}
                {daysLeft !== null && daysLeft < 0 && (
                  <span className="text-red-500 font-medium ml-1">
                    ({Math.abs(daysLeft)} day
                    {Math.abs(daysLeft) !== 1 ? "s" : ""} overdue)
                  </span>
                )}
              </span>
            </div>
          )}
          {project.jurisdictions && project.jurisdictions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{project.jurisdictions.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline visualisation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Timeline
        </h2>
        <ProjectTimeline
          serviceType={project.service_type}
          currentStatus={project.status}
        />
      </div>

      {/* Two-column grid: Updates + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Updates */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Updates
          </h2>
          <UpdatesFeed updates={updates} />
        </div>

        {/* Sidebar: Documents + Milestones */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Documents
            </h2>
            <DocumentsList documents={documents} />
          </div>

          {milestones.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Milestones
              </h2>
              <MilestonesList milestones={milestones} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
