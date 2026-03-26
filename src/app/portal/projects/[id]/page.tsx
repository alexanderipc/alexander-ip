import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessProject } from "@/lib/portal/access";
import {
  getServiceLabel,
  getProgressPercent,
  getDaysRemaining,
  isComplete,
} from "@/lib/portal/status";
import StatusBadge from "@/components/portal/StatusBadge";
import ProgressBar from "@/components/portal/ProgressBar";
import ProjectTimeline from "@/components/portal/ProjectTimeline";
import UpdatesFeed from "@/components/portal/UpdatesFeed";
import DocumentThumbnailGrid from "@/components/ui/DocumentThumbnailGrid";
import ClientDocumentUpload from "@/components/portal/ClientDocumentUpload";
import MilestonesList from "@/components/portal/MilestonesList";
import MessageThread from "@/components/portal/MessageThread";
import ClientNotificationMute from "@/components/portal/ClientNotificationMute";
import TeamMembers from "@/components/portal/TeamMembers";
import PortalVisitTracker from "@/components/portal/PortalVisitTracker";
import UploadNudgeModal from "@/components/portal/UploadNudgeModal";
import { ArrowLeft, Calendar, Globe, Clock, MessageCircle, Users, Star, ExternalLink, UploadCloud } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("[Portal] Failed to create Supabase client:", err);
    redirect("/auth/login");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("[Portal] Auth error:", authError.message);
  }
  if (!user) redirect("/auth/login");

  // Use admin client for all DB queries to avoid JWT refresh 400s from PostgREST.
  // Security: getUser() already validated identity; we add explicit client_id checks.
  const adminClient = createAdminClient();

  // Check team membership (project_members) or legacy client_id
  const hasAccess = await canAccessProject(user.id, id);
  if (!hasAccess) notFound();

  const { data: project, error } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[Portal] Project fetch error:", error.message, "| project_id:", id, "| user:", user.id);
  }
  if (error || !project) notFound();

  // Fetch related data in parallel — each query is individually safe
  interface Msg {
    id: string;
    body: string;
    is_admin: boolean;
    read_at: string | null;
    created_at: string;
    sender_id: string;
    project_id: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updates: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawDocs: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let milestones: any[] = [];
  let messages: Msg[] = [];

  try {
    const [updatesResult, docsResult, milestonesResult] = await Promise.all([
      adminClient
        .from("project_updates")
        .select("id, project_id, status_from, status_to, note, notify_client, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      adminClient
        .from("project_documents")
        .select("id, project_id, filename, file_url, document_type, client_visible, uploaded_at, uploaded_by")
        .eq("project_id", id)
        .eq("client_visible", true)
        .order("uploaded_at", { ascending: false }),
      adminClient
        .from("project_milestones")
        .select("id, project_id, title, target_date, completed_date, is_client_visible, created_at")
        .eq("project_id", id)
        .eq("is_client_visible", true)
        .order("target_date", { ascending: true }),
    ]);
    if (updatesResult.error) console.error("[Portal] Updates query error:", updatesResult.error.message);
    if (docsResult.error) console.error("[Portal] Documents query error:", docsResult.error.message);
    if (milestonesResult.error) console.error("[Portal] Milestones query error:", milestonesResult.error.message);
    updates = updatesResult.data || [];
    rawDocs = docsResult.data || [];
    milestones = milestonesResult.data || [];
  } catch (fetchErr) {
    console.error("[Portal] Failed to fetch project data:", fetchErr);
  }

  // Fetch messages separately — table may not exist yet
  try {
    const messagesResult = await adminClient
      .from("project_messages")
      .select("id, project_id, sender_id, body, is_admin, read_at, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: true });
    if (messagesResult.error) console.error("[Portal] Messages query error:", messagesResult.error.message);
    messages = (messagesResult.data as Msg[]) || [];
  } catch {
    messages = [];
  }

  const unreadMessages = messages.filter((m) => m.is_admin && !m.read_at).length;

  // Fetch team members (two-step: members then profiles, since no FK from project_members to profiles)
  let teamMembers: { id: string; user_id: string; role: "owner" | "member"; name: string | null; email: string | null }[] = [];
  try {
    const { data: members } = await adminClient
      .from("project_members")
      .select("id, user_id, role")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (members && members.length > 0) {
      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { name: p.name, email: p.email }])
      );

      teamMembers = members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role as "owner" | "member",
        name: profileMap.get(m.user_id)?.name || null,
        email: profileMap.get(m.user_id)?.email || null,
      }));
    }
  } catch {
    teamMembers = [];
  }

  const isOwner = teamMembers.some(
    (m) => m.user_id === user.id && m.role === "owner"
  ) || project.client_id === user.id;

  // Generate signed URLs for documents (bucket is private, use admin client)
  // Each URL is generated individually so one failure doesn't crash the page
  let documents: (typeof rawDocs[number] & { signed_url: string })[] = [];
  try {
    documents = await Promise.all(
      rawDocs.map(async (doc) => {
        try {
          const { data } = await adminClient.storage
            .from("project-documents")
            .createSignedUrl(doc.file_url, 3600);
          return { ...doc, signed_url: data?.signedUrl || "#" };
        } catch (urlErr) {
          console.error("[Portal] Failed to create signed URL for", doc.file_url, urlErr);
          return { ...doc, signed_url: "#" };
        }
      })
    );
  } catch (signedUrlErr) {
    console.error("[Portal] Failed to generate signed URLs:", signedUrlErr);
    documents = rawDocs.map((doc) => ({ ...doc, signed_url: "#" }));
  }

  const percent = getProgressPercent(project.service_type, project.status);
  const complete = isComplete(project.status) || project.status === "complete_granted";
  const daysLeft = project.estimated_delivery_date
    ? getDaysRemaining(project.estimated_delivery_date)
    : null;

  return (
    <div>
      {/* Invisible trackers */}
      <PortalVisitTracker projectId={project.id} />
      {!complete && <UploadNudgeModal projectId={project.id} />}

      {/* Back link */}
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Deadline banner — prominent, above everything */}
      {!complete && project.estimated_delivery_date && (
        <div
          className={`rounded-xl border p-4 mb-4 flex items-center gap-3 ${
            daysLeft !== null && daysLeft < 0
              ? "bg-red-50 border-red-200"
              : daysLeft !== null && daysLeft <= 7
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <Clock
            className={`w-5 h-5 flex-shrink-0 ${
              daysLeft !== null && daysLeft < 0
                ? "text-red-500"
                : daysLeft !== null && daysLeft <= 7
                ? "text-amber-500"
                : "text-blue-500"
            }`}
          />
          <div>
            <p
              className={`text-sm font-semibold ${
                daysLeft !== null && daysLeft < 0
                  ? "text-red-700"
                  : daysLeft !== null && daysLeft <= 7
                  ? "text-amber-700"
                  : "text-blue-700"
              }`}
            >
              {daysLeft !== null && daysLeft < 0
                ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}`
                : daysLeft !== null && daysLeft === 0
                ? "Due today"
                : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
            </p>
            <p
              className={`text-xs ${
                daysLeft !== null && daysLeft < 0
                  ? "text-red-600"
                  : daysLeft !== null && daysLeft <= 7
                  ? "text-amber-600"
                  : "text-blue-600"
              }`}
            >
              Estimated delivery:{" "}
              {new Date(project.estimated_delivery_date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}
      {complete && project.actual_delivery_date && (
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-4 mb-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">
            Completed on{" "}
            {new Date(project.actual_delivery_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Trustpilot review prompt — shown when project is complete */}
      {complete && (
        <a
          href="https://uk.trustpilot.com/review/alexander-ip.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 mb-4 hover:bg-green-100 transition-colors group"
        >
          <Star className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">
              How was your experience?
            </p>
            <p className="text-xs text-green-600">
              We'd really appreciate a review on Trustpilot — it helps us grow and helps others find us.
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-green-500 group-hover:text-green-700 flex-shrink-0" />
        </a>
      )}

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
          {project.jurisdictions && project.jurisdictions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{project.jurisdictions.join(", ")}</span>
            </div>
          )}
          <ClientNotificationMute
            projectId={project.id}
            muted={project.client_notifications_muted ?? false}
          />
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

      {/* Two-column grid: Updates + Messages | Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
              {unreadMessages > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </h2>
            <MessageThread
              projectId={project.id}
              messages={messages}
              userId={user.id}
            />
          </div>

          {/* Updates */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Updates
            </h2>
            <UpdatesFeed updates={updates} />
          </div>
        </div>

        {/* Sidebar: Upload + Documents + Milestones */}
        <div className="space-y-6">
          {/* Upload prompt — prominent, at the top of sidebar */}
          {!complete && (
            <div className="bg-blue-50 rounded-xl border-2 border-blue-200 border-dashed p-5">
              <div className="flex items-start gap-3 mb-3">
                <UploadCloud className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">
                    Upload your files here
                  </h3>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Please upload any documents, drawings, or reference materials related to this project. We&apos;ll receive them instantly.
                  </p>
                </div>
              </div>
              <ClientDocumentUpload projectId={project.id} />
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Documents
            </h2>

            {/* Documents from Alexander IP */}
            {(() => {
              const adminDocs = documents.filter(
                (d) => d.uploaded_by !== user.id
              );
              const clientDocs = documents.filter(
                (d) => d.uploaded_by === user.id
              );
              return (
                <>
                  {adminDocs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 mb-2">From Alexander IP</p>
                      <DocumentThumbnailGrid documents={adminDocs} trackAccess />
                    </div>
                  )}
                  {clientDocs.length > 0 && (
                    <div className={adminDocs.length > 0 ? "pt-4 border-t border-slate-100" : ""}>
                      <p className="text-xs font-medium text-slate-500 mb-2">Your uploads</p>
                      <DocumentThumbnailGrid documents={clientDocs} trackAccess />
                    </div>
                  )}
                  {documents.length === 0 && (
                    <p className="text-sm text-slate-400 italic">
                      No documents yet — files will appear here as they become available.
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          {milestones.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Milestones
              </h2>
              <MilestonesList milestones={milestones} />
            </div>
          )}

          {/* Team Members */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team ({teamMembers.length})
            </h2>
            <TeamMembers
              projectId={project.id}
              members={teamMembers}
              isOwner={isOwner}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
