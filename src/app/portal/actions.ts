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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function clientUploadDocument(
  projectId: string,
  formData: FormData
) {
  const { supabase, user } = await requireClient();
  const adminClient = createAdminClient();

  // Verify the client owns this project (RLS would catch this too, but be explicit)
  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > MAX_FILE_SIZE) throw new Error("File too large (max 10 MB)");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File type not supported");
  }

  // Upload to storage using admin client (bypasses storage RLS)
  const filePath = `${projectId}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from("project-documents")
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
    });

  if (uploadError) {
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
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return { success: true };
}

/* ── Send Message (Client) ─────────────────────────────────── */

export async function sendClientMessage(projectId: string, body: string) {
  const { supabase, user } = await requireClient();

  if (!body.trim()) throw new Error("Message cannot be empty");
  if (body.length > 2000) throw new Error("Message too long (max 2000 characters)");

  // Verify client owns this project
  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id, title")
    .eq("id", projectId)
    .single();

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  // Insert message
  const { error } = await supabase.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    body: body.trim(),
    is_admin: false,
  });

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Notify admin via email
  try {
    const { data: clientProfile } = await supabase
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

  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return { success: true };
}

/* ── Mark Messages Read (Client) ───────────────────────────── */

export async function markMessagesRead(projectId: string) {
  const { supabase, user } = await requireClient();

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }

  // Mark admin messages (is_admin = true) as read
  await supabase
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
  const { supabase, user } = await requireClient();

  // Build date range for the month (with padding for calendar display)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-31`
      : `${year}-${String(month + 1).padStart(2, "0")}-31`;

  const events: ClientCalendarEvent[] = [];

  // Fetch this client's projects with delivery dates in range (non-complete)
  const { data: projects } = await supabase
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
  const { data: allProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", user.id);

  const allProjectIds = allProjects?.map((p) => p.id) || [];

  if (allProjectIds.length > 0) {
    const { data: milestones } = await supabase
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
