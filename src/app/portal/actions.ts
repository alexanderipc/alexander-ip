"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendNewMessageEmail } from "@/lib/email";
import type { NotificationPreferences } from "@/lib/supabase/types";

const PORTAL_URL = "https://www.alexander-ip.com/auth/login";

/* ── Helpers ──────────────────────────────────────────────── */

async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/* ── Upload Document (Client) ─────────────────────────────── */

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/octet-stream", // fallback for archives
];

export async function clientUploadDocument(
  projectId: string,
  formData: FormData
) {
  const { user } = await requireClient();
  const adminClient = createAdminClient();

  // Verify the client owns this project (admin client for JWT resilience)
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();

  if (projectError) {
    console.error("[Upload] Project lookup error:", projectError.message, projectError.code, "| projectId:", projectId, "| user:", user.id);
  }

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > MAX_FILE_SIZE) throw new Error("File too large (max 50 MB)");

  // Extension-based fallback for archives (browsers often send application/octet-stream)
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const archiveExts = ["zip", "rar", "7z"];
  const isArchiveByExt = archiveExts.includes(ext);

  if (!ALLOWED_TYPES.includes(file.type) && !isArchiveByExt) {
    throw new Error("File type not supported");
  }

  // Upload to storage using admin client (bypasses storage RLS)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${projectId}/${Date.now()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from("project-documents")
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[Upload] Storage upload error:", uploadError.message, "| path:", filePath);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Create document record — client uploads are always visible and typed as "correspondence"
  const { error: insertError } = await adminClient
    .from("project_documents")
    .insert({
      project_id: projectId,
      filename: file.name,
      file_url: filePath,
      document_type: "correspondence",
      client_visible: true,
      uploaded_by: user.id,
    });

  if (insertError) {
    console.error("[Upload] DB insert error:", insertError.message, "| projectId:", projectId);
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  console.log("[Upload] Success:", file.name, "→", filePath, "| user:", user.id);

  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return { success: true };
}

/* ── Send Message (Client) ─────────────────────────────────── */

export async function sendClientMessage(projectId: string, body: string) {
  const { supabase, user } = await requireClient();
  const adminClient = createAdminClient();

  if (!body.trim()) throw new Error("Message cannot be empty");
  if (body.length > 10000) throw new Error("Message too long (max 10,000 characters)");

  // Verify client owns this project
  // Use admin client for ownership check — avoids intermittent 400 errors
  // when the user's JWT is in a refresh state during server actions.
  // Security is maintained: getUser() already validated the user server-side.
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) {
    console.error("[SendMessage] Project lookup error:", projectError.message, projectError.code, "| projectId:", projectId, "| user:", user.id);
  }

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  // Insert message using admin client (user INSERT RLS works, but keep
  // consistent with the ownership check to avoid the same JWT issue)
  const { error } = await adminClient.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    body: body.trim(),
    is_admin: false,
  });

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Notify admin via email (skip if project-level admin mute is on)
  if (!project?.admin_notifications_muted) {
    try {
      const { data: clientProfile } = await adminClient
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      const senderName = clientProfile?.name || clientProfile?.email || "Client";

      await sendNewMessageEmail("alexanderip.contact@gmail.com", {
        projectTitle: project.title,
        senderName,
        messagePreview: body.trim(),
        portalUrl: PORTAL_URL,
      });
    } catch (emailErr) {
      console.error("Failed to send message notification email:", emailErr);
    }
  }

  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return { success: true };
}

/* ── Mark Messages Read (Client) ───────────────────────────── */

export async function markMessagesRead(projectId: string) {
  const { user } = await requireClient();
  const adminClient = createAdminClient();

  // Verify ownership using admin client (same JWT resilience pattern)
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();

  if (projectError) {
    console.error("[MarkRead] Project lookup error:", projectError.message, projectError.code, "| projectId:", projectId, "| user:", user.id);
  }

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  // Mark admin messages (is_admin = true) as read
  await adminClient
    .from("project_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("is_admin", true)
    .is("read_at", null);

  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Client Calendar Data ─────────────────────────────────────── */

export interface ClientCalendarEvent {
  id: string;
  title: string;
  projectId: string;
  date: string;
  type: "deadline" | "milestone";
}

export async function getClientCalendarData(year: number, month: number) {
  const { user } = await requireClient();
  const adminClient = createAdminClient();

  // Build date range for the month (with padding for next-month calendar rows)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  // Use JS Date to get the correct last day of next month (avoids invalid dates like Apr-31)
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDateObj = new Date(endYear, endMonth, 0); // day 0 = last day of prev month
  const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

  const events: ClientCalendarEvent[] = [];

  // Fetch this client's projects with delivery dates in range (non-complete)
  const { data: projects } = await adminClient
    .from("projects")
    .select("id, title, estimated_delivery_date, status")
    .eq("client_id", user.id)
    .gte("estimated_delivery_date", startDate)
    .lte("estimated_delivery_date", endDate)
    .not("status", "in", '("complete","complete_granted")');

  if (projects) {
    for (const p of projects) {
      if (!p.estimated_delivery_date) continue;
      events.push({
        id: `deadline-${p.id}`,
        title: p.title,
        projectId: p.id,
        date: p.estimated_delivery_date,
        type: "deadline",
      });
    }
  }

  // Fetch client-visible incomplete milestones with target dates in range
  const projectIds = projects?.map((p) => p.id) || [];

  // Also get all client's active project IDs (milestones might belong to projects outside date range)
  const { data: allProjects } = await adminClient
    .from("projects")
    .select("id")
    .eq("client_id", user.id);

  const allProjectIds = allProjects?.map((p) => p.id) || [];

  if (allProjectIds.length > 0) {
    const { data: milestones } = await adminClient
      .from("project_milestones")
      .select("id, title, target_date, project_id, projects(title)")
      .in("project_id", allProjectIds)
      .eq("is_client_visible", true)
      .gte("target_date", startDate)
      .lte("target_date", endDate)
      .is("completed_date", null);

    if (milestones) {
      for (const m of milestones) {
        if (!m.target_date) continue;
        const project = m.projects as unknown as { title: string } | null;
        events.push({
          id: `milestone-${m.id}`,
          title: `${m.title} — ${project?.title || "Unknown project"}`,
          projectId: m.project_id,
          date: m.target_date,
          type: "milestone",
        });
      }
    }
  }

  return events;
}

/* ── Update Notification Preferences ─────────────────────────── */

export async function updateNotificationPreferences(
  prefs: NotificationPreferences
) {
  const { supabase, user } = await requireClient();

  // Validate shape
  if (
    typeof prefs.status_updates !== "boolean" ||
    typeof prefs.document_uploads !== "boolean" ||
    typeof prefs.new_messages !== "boolean"
  ) {
    throw new Error("Invalid preferences format");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notification_preferences: prefs })
    .eq("id", user.id);

  if (error) throw new Error(`Failed to update preferences: ${error.message}`);

  revalidatePath("/portal/settings");

  return { success: true };
}

/* ── Toggle Client Notification Mute ─────────────────────────── */

export async function toggleClientNotificationMute(projectId: string) {
  const { user } = await requireClient();
  const adminClient = createAdminClient();

  // Verify client owns this project (admin client for JWT resilience)
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) {
    console.error("[ToggleMute] Project lookup error:", projectError.message, projectError.code, "| projectId:", projectId, "| user:", user.id);
  }

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  const { error: updateError } = await adminClient
    .from("projects")
    .update({ client_notifications_muted: !project?.client_notifications_muted })
    .eq("id", projectId);

  if (updateError) {
    console.error("[ToggleMute] Update error (column may not exist):", updateError.message);
  }

  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}
