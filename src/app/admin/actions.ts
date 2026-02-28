"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  getNextStatus,
  getStatusLabel,
  calculateDeliveryDate,
  DEFAULT_TIMELINES,
} from "@/lib/portal/status";
import type { ServiceType, NotificationPreferences } from "@/lib/supabase/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/supabase/types";
import {
  sendProjectCreatedEmail,
  sendStatusUpdateEmail,
  sendDocumentUploadedEmail,
  sendNewMessageEmail,
} from "@/lib/email";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe";

const PORTAL_URL = "https://www.alexander-ip.com/auth/login";

/* ── Helpers ──────────────────────────────────────────────── */

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, user };
}

/* ── Create Project ──────────────────────────────────────── */

export async function createProject(formData: FormData) {
  const { supabase } = await requireAdmin();
  const adminClient = createAdminClient();

  const clientEmail = formData.get("client_email") as string;
  const clientName = formData.get("client_name") as string;
  const serviceType = formData.get("service_type") as ServiceType;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const jurisdictionsRaw = (formData.get("jurisdictions") as string) || "";
  const jurisdictions = jurisdictionsRaw
    .split(",")
    .map((j) => j.trim())
    .filter(Boolean);
  const pricePaid = formData.get("price_paid")
    ? parseInt(formData.get("price_paid") as string, 10)
    : null;
  const currency = (formData.get("currency") as string) || "USD";
  const timelineDays = formData.get("timeline_days")
    ? parseInt(formData.get("timeline_days") as string, 10)
    : DEFAULT_TIMELINES[serviceType] || null;
  const note = (formData.get("note") as string) || null;

  // Find or create client
  let clientId: string;

  // Check if client already exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === clientEmail
  );

  if (existingUser) {
    clientId = existingUser.id;
    // Update name/email if provided
    const updates: Record<string, string> = { email: clientEmail };
    if (clientName) updates.name = clientName;
    await supabase.from("profiles").update(updates).eq("id", clientId);
  } else {
    // Create new user (triggers auto-profile via DB trigger)
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: clientEmail,
        email_confirm: true,
        user_metadata: { name: clientName || clientEmail.split("@")[0] },
      });

    if (createError || !newUser.user) {
      throw new Error(
        `Failed to create client: ${createError?.message || "Unknown error"}`
      );
    }

    clientId = newUser.user.id;

    // Update profile name
    if (clientName) {
      await supabase
        .from("profiles")
        .update({ name: clientName })
        .eq("id", clientId);
    }
  }

  // Calculate delivery date
  const startDate = new Date().toISOString().split("T")[0];
  const estimatedDelivery = timelineDays
    ? calculateDeliveryDate(startDate, timelineDays)
    : null;

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      service_type: serviceType,
      title,
      description,
      status: "payment_received",
      jurisdictions,
      start_date: startDate,
      default_timeline_days: timelineDays,
      estimated_delivery_date: estimatedDelivery,
      price_paid: pricePaid,
      currency,
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(
      `Failed to create project: ${projectError?.message || "Unknown error"}`
    );
  }

  // Create initial update
  await supabase.from("project_updates").insert({
    project_id: project.id,
    status_to: "payment_received",
    note:
      note ||
      `Project created. ${
        estimatedDelivery
          ? `Estimated delivery: ${new Date(estimatedDelivery).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
          : ""
      }`,
    notify_client: true,
  });

  // Send welcome email to client
  try {
    await sendProjectCreatedEmail(clientEmail, {
      title,
      serviceType,
      estimatedDelivery,
      portalUrl: PORTAL_URL,
    });
  } catch (emailErr) {
    console.error("Failed to send project created email:", emailErr);
  }

  revalidatePath("/admin");
  revalidatePath("/portal");

  return { success: true, projectId: project.id };
}

/* ── Advance Status ──────────────────────────────────────── */

export async function advanceStatus(
  projectId: string,
  note?: string,
  internalNote?: string,
  notifyClient: boolean = true
) {
  const { supabase } = await requireAdmin();

  // Fetch current project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const nextStatus = getNextStatus(project.service_type, project.status);
  if (!nextStatus) throw new Error("Project is already at final status");

  // Update project status
  const updateData: Record<string, unknown> = { status: nextStatus };

  // If completing, set actual delivery date
  if (nextStatus === "complete" || nextStatus === "complete_granted") {
    updateData.actual_delivery_date = new Date().toISOString().split("T")[0];
  }

  await supabase.from("projects").update(updateData).eq("id", projectId);

  // Create update record
  await supabase.from("project_updates").insert({
    project_id: projectId,
    status_from: project.status,
    status_to: nextStatus,
    note:
      note || `Status updated to ${getStatusLabel(nextStatus)}.`,
    internal_note: internalNote || null,
    notify_client: notifyClient,
  });

  // Send email notification
  if (notifyClient) {
    try {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("email, notification_preferences")
        .eq("id", project.client_id)
        .single();

      const prefs = (clientProfile?.notification_preferences as NotificationPreferences | null) ?? DEFAULT_NOTIFICATION_PREFERENCES;

      if (clientProfile?.email && prefs.status_updates) {
        const unsubscribeUrl = buildUnsubscribeUrl(project.client_id, "status_updates");
        await sendStatusUpdateEmail(clientProfile.email, {
          title: project.title,
          serviceType: project.service_type as ServiceType,
          newStatus: nextStatus,
          statusLabel: getStatusLabel(nextStatus),
          note: note || null,
          portalUrl: PORTAL_URL,
          unsubscribeUrl,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send status update email:", emailErr);
    }
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/portal");

  return { success: true, newStatus: nextStatus };
}

/* ── Add Update/Note ─────────────────────────────────────── */

export async function addUpdate(
  projectId: string,
  note: string,
  internalNote?: string,
  notifyClient: boolean = true
) {
  const { supabase } = await requireAdmin();

  const { data: project } = await supabase
    .from("projects")
    .select("status, title, service_type, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  await supabase.from("project_updates").insert({
    project_id: projectId,
    status_from: project.status,
    status_to: project.status,
    note,
    internal_note: internalNote || null,
    notify_client: notifyClient,
  });

  // Send email notification
  if (notifyClient) {
    try {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("email, notification_preferences")
        .eq("id", project.client_id)
        .single();

      const prefs = (clientProfile?.notification_preferences as NotificationPreferences | null) ?? DEFAULT_NOTIFICATION_PREFERENCES;

      if (clientProfile?.email && prefs.status_updates) {
        const unsubscribeUrl = buildUnsubscribeUrl(project.client_id, "status_updates");
        await sendStatusUpdateEmail(clientProfile.email, {
          title: project.title,
          serviceType: project.service_type as ServiceType,
          newStatus: project.status,
          statusLabel: getStatusLabel(project.status),
          note,
          portalUrl: PORTAL_URL,
          unsubscribeUrl,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send update email:", emailErr);
    }
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Update Delivery Date ────────────────────────────────── */

export async function updateDeliveryDate(
  projectId: string,
  newDate: string,
  note?: string
) {
  const { supabase } = await requireAdmin();

  await supabase
    .from("projects")
    .update({ estimated_delivery_date: newDate })
    .eq("id", projectId);

  if (note) {
    const { data: project } = await supabase
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single();

    await supabase.from("project_updates").insert({
      project_id: projectId,
      status_from: project?.status || "",
      status_to: project?.status || "",
      note: `Delivery date updated to ${new Date(newDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. ${note}`,
      notify_client: true,
    });
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");

  return { success: true };
}

/* ── Upload Document ─────────────────────────────────────── */

export async function uploadDocument(
  projectId: string,
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();
  const adminClient = createAdminClient();

  const file = formData.get("file") as File;
  const documentType =
    (formData.get("document_type") as string) || "other";
  const clientVisible = formData.get("client_visible") !== "false";

  if (!file || file.size === 0) throw new Error("No file provided");

  // Upload to Supabase Storage using admin client (bypasses storage RLS)
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

  // Store the storage path (not a URL) — we'll generate signed URLs on demand
  // Create document record
  const { error: insertError } = await supabase.from("project_documents").insert({
    project_id: projectId,
    filename: file.name,
    file_url: filePath,
    document_type: documentType as import("@/lib/supabase/types").DocumentType,
    client_visible: clientVisible,
    uploaded_by: user.id,
  });

  if (insertError) {
    throw new Error(`Failed to save document record: ${insertError.message}`);
  }

  // Send email notification for client-visible documents
  if (clientVisible) {
    try {
      const { data: project } = await supabase
        .from("projects")
        .select("title, client_id")
        .eq("id", projectId)
        .single();

      if (project) {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("email, notification_preferences")
          .eq("id", project.client_id)
          .single();

        const prefs = (clientProfile?.notification_preferences as NotificationPreferences | null) ?? DEFAULT_NOTIFICATION_PREFERENCES;

        if (clientProfile?.email && prefs.document_uploads) {
          const unsubscribeUrl = buildUnsubscribeUrl(project.client_id, "document_uploads");
          await sendDocumentUploadedEmail(clientProfile.email, {
            title: project.title,
            filename: file.name,
            portalUrl: PORTAL_URL,
            unsubscribeUrl,
          });
        }
      }
    } catch (emailErr) {
      console.error("Failed to send document email:", emailErr);
    }
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Add Milestone ───────────────────────────────────────── */

export async function addMilestone(
  projectId: string,
  title: string,
  targetDate: string | null,
  clientVisible: boolean = true
) {
  const { supabase } = await requireAdmin();

  await supabase.from("project_milestones").insert({
    project_id: projectId,
    title,
    target_date: targetDate,
    is_client_visible: clientVisible,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Complete Milestone ─────────────────────────────────── */

export async function completeMilestone(
  milestoneId: string,
  projectId: string
) {
  const { supabase } = await requireAdmin();

  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("project_milestones")
    .update({ completed_date: today })
    .eq("id", milestoneId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Uncomplete Milestone ───────────────────────────────── */

export async function uncompleteMilestone(
  milestoneId: string,
  projectId: string
) {
  const { supabase } = await requireAdmin();

  await supabase
    .from("project_milestones")
    .update({ completed_date: null })
    .eq("id", milestoneId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Delete Milestone ───────────────────────────────────── */

export async function deleteMilestone(
  milestoneId: string,
  projectId: string
) {
  const { supabase } = await requireAdmin();

  await supabase
    .from("project_milestones")
    .delete()
    .eq("id", milestoneId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Update Timeline Days ───────────────────────────────── */

export async function updateTimelineDays(
  projectId: string,
  timelineDays: number | null
) {
  const { supabase } = await requireAdmin();

  const { data: project } = await supabase
    .from("projects")
    .select("start_date")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const estimatedDelivery =
    timelineDays && project.start_date
      ? calculateDeliveryDate(project.start_date, timelineDays)
      : null;

  await supabase
    .from("projects")
    .update({
      default_timeline_days: timelineDays,
      estimated_delivery_date: estimatedDelivery,
    })
    .eq("id", projectId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath("/admin");

  return { success: true };
}

/* ── Send Message (Admin) ─────────────────────────────────── */

export async function sendAdminMessage(projectId: string, body: string) {
  const { supabase, user } = await requireAdmin();

  if (!body.trim()) throw new Error("Message cannot be empty");
  if (body.length > 2000) throw new Error("Message too long (max 2000 characters)");

  // Fetch project info for email
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  // Insert message
  const { error } = await supabase.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    body: body.trim(),
    is_admin: true,
  });

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Notify client via email
  try {
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("email, notification_preferences")
      .eq("id", project.client_id)
      .single();

    const prefs = (clientProfile?.notification_preferences as NotificationPreferences | null) ?? DEFAULT_NOTIFICATION_PREFERENCES;

    if (clientProfile?.email && prefs.new_messages) {
      const unsubscribeUrl = buildUnsubscribeUrl(project.client_id, "new_messages");
      await sendNewMessageEmail(clientProfile.email, {
        projectTitle: project.title,
        senderName: "Alexander IP",
        messagePreview: body.trim(),
        portalUrl: PORTAL_URL,
        unsubscribeUrl,
      });
    }
  } catch (emailErr) {
    console.error("Failed to send message notification email:", emailErr);
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Mark Messages Read (Admin) ───────────────────────────── */

export async function markAdminMessagesRead(projectId: string) {
  const { supabase } = await requireAdmin();

  // Mark client messages (is_admin = false) as read
  await supabase
    .from("project_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("is_admin", false)
    .is("read_at", null);

  revalidatePath(`/admin/projects/${projectId}`);

  return { success: true };
}

/* ── Calendar Data ────────────────────────────────────────── */

export interface CalendarEvent {
  id: string;
  title: string;
  projectId: string;
  date: string;
  type: "deadline" | "milestone";
  clientName: string;
}

export async function getCalendarData(year: number, month: number) {
  const { supabase } = await requireAdmin();

  // Build date range for the month (with padding for calendar display)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-31`
      : `${year}-${String(month + 1).padStart(2, "0")}-31`;

  const events: CalendarEvent[] = [];

  // Fetch projects with delivery dates in range (non-complete only)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, estimated_delivery_date, status, client_id, profiles(name, email)")
    .gte("estimated_delivery_date", startDate)
    .lte("estimated_delivery_date", endDate)
    .not("status", "in", '("complete","complete_granted")');

  if (projects) {
    for (const p of projects) {
      if (!p.estimated_delivery_date) continue;
      const profile = p.profiles as unknown as {
        name: string | null;
        email: string;
      } | null;
      events.push({
        id: `deadline-${p.id}`,
        title: p.title,
        projectId: p.id,
        date: p.estimated_delivery_date,
        type: "deadline",
        clientName: profile?.name || profile?.email || "Unknown",
      });
    }
  }

  // Fetch incomplete milestones with target dates in range
  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("id, title, target_date, project_id, projects(title, client_id, profiles(name, email))")
    .gte("target_date", startDate)
    .lte("target_date", endDate)
    .is("completed_date", null);

  if (milestones) {
    for (const m of milestones) {
      if (!m.target_date) continue;
      const project = m.projects as unknown as {
        title: string;
        client_id: string;
        profiles: { name: string | null; email: string } | null;
      } | null;
      events.push({
        id: `milestone-${m.id}`,
        title: `${m.title} — ${project?.title || "Unknown project"}`,
        projectId: m.project_id,
        date: m.target_date,
        type: "milestone",
        clientName:
          project?.profiles?.name || project?.profiles?.email || "Unknown",
      });
    }
  }

  return events;
}
