import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getServiceLabel,
  getStatusLabel,
  getProgressPercent,
  getNextStatus,
  getDaysRemaining,
  isComplete,
} from "@/lib/portal/status";
import StatusBadge from "@/components/portal/StatusBadge";
import ProgressBar from "@/components/portal/ProgressBar";
import ProjectTimeline from "@/components/portal/ProjectTimeline";
import DeadlineIndicator from "@/components/admin/DeadlineIndicator";
import AdminStatusAdvancer from "@/components/admin/StatusAdvancer";
import AdminUpdateForm from "@/components/admin/UpdateForm";
import AdminDocumentUpload from "@/components/admin/DocumentUpload";
import { ArrowLeft, Calendar, Globe, User, CreditCard } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectDetailPage({ params }: Props) {
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

  // Fetch project with client info
  const { data: project, error } = await supabase
    .from("projects")
    .select("*, profiles(name, email, company, phone)")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  const client = project.profiles as unknown as {
    name: string | null;
    email: string;
    company: string | null;
    phone: string | null;
  } | null;

  // Fetch related data
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
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", id)
      .order("target_date", { ascending: true }),
  ]);

  const updates = updatesResult.data || [];
  const documents = docsResult.data || [];
  const milestones = milestonesResult.data || [];
  const percent = getProgressPercent(project.service_type, project.status);
  const nextStatus = getNextStatus(project.service_type, project.status);
  const complete = isComplete(project.status);

  return (
    <div>
      <Link
        href="/admin"
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
          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            <DeadlineIndicator
              deliveryDate={project.estimated_delivery_date}
              status={project.status}
            />
          </div>
        </div>

        <ProgressBar percent={percent} />

        {/* Key info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          {client && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>{client.name || client.email}</span>
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Started{" "}
                {new Date(project.start_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          {project.jurisdictions?.length > 0 && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{project.jurisdictions.join(", ")}</span>
            </div>
          )}
          {project.price_paid && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>
                {project.currency === "GBP" ? "\u00A3" : project.currency === "EUR" ? "\u20AC" : "$"}
                {(project.price_paid / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Advancement */}
      {!complete && nextStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <AdminStatusAdvancer
            projectId={project.id}
            currentStatus={project.status}
            nextStatus={nextStatus}
          />
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Timeline
        </h2>
        <ProjectTimeline
          serviceType={project.service_type}
          currentStatus={project.status}
        />
      </div>

      {/* Three column: Updates | Documents | Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Updates feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add update form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Add Update
            </h2>
            <AdminUpdateForm projectId={project.id} />
          </div>

          {/* Updates list (including internal notes) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Updates ({updates.length})
            </h2>
            {updates.length > 0 ? (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-slate-200 pl-4 py-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <time className="text-xs text-slate-400">
                        {new Date(update.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </time>
                      {update.status_from &&
                        update.status_from !== update.status_to && (
                          <span className="text-xs text-slate-500">
                            {getStatusLabel(update.status_from)} →{" "}
                            {getStatusLabel(update.status_to)}
                          </span>
                        )}
                      {update.notify_client && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                          Client notified
                        </span>
                      )}
                    </div>
                    {update.note && (
                      <p className="text-sm text-slate-700">{update.note}</p>
                    )}
                    {update.internal_note && (
                      <p className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                        <span className="font-medium">Internal: </span>
                        {update.internal_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No updates yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Documents ({documents.length})
            </h2>
            <AdminDocumentUpload projectId={project.id} />
            {documents.length > 0 && (
              <div className="mt-4 divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="min-w-0">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-navy hover:text-blue-600 truncate block"
                      >
                        {doc.filename}
                      </a>
                      <p className="text-xs text-slate-400">
                        {doc.client_visible ? "Client visible" : "Admin only"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client info */}
          {client && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Client
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-navy font-medium">{client.name}</p>
                <p className="text-slate-600">{client.email}</p>
                {client.company && (
                  <p className="text-slate-500">{client.company}</p>
                )}
                {client.phone && (
                  <p className="text-slate-500">{client.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
