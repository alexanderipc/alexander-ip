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
  sendOfferEmail,
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

  // Use admin client for role check — the user's JWT can intermittently
  // return 400 from PostgREST during server actions (token refresh timing).
  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[Admin] Profile lookup error:", profileError.message, profileError.code, "| user:", user.id);
  }

  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, user };
}

/* ── Create Project ──────────────────────────────────────── */

export async function createProject(formData: FormData) {
  await requireAdmin();
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
    await adminClient.from("profiles").update(updates).eq("id", clientId);
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
      await adminClient
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
  const { data: project, error: projectError } = await adminClient
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
  await adminClient.from("project_updates").insert({
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
  await requireAdmin();
  const adminClient = createAdminClient();

  // Fetch current project
  const { data: project } = await adminClient
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

  await adminClient.from("projects").update(updateData).eq("id", projectId);

  // Create update record
  await adminClient.from("project_updates").insert({
    project_id: projectId,
    status_from: project.status,
    status_to: nextStatus,
    note:
      note || `Status updated to ${getStatusLabel(nextStatus)}.`,
    internal_note: internalNote || null,
    notify_client: notifyClient,
  });

  // Send email notification (skip if project-level mute is on)
  if (notifyClient && !project?.client_notifications_muted) {
    try {
      const { data: clientProfile } = await adminClient
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
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: project } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  await adminClient.from("project_updates").insert({
    project_id: projectId,
    status_from: project.status,
    status_to: project.status,
    note,
    internal_note: internalNote || null,
    notify_client: notifyClient,
  });

  // Send email notification (skip if project-level mute is on)
  if (notifyClient && !project?.client_notifications_muted) {
    try {
      const { data: clientProfile } = await adminClient
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
  await requireAdmin();
  const adminClient = createAdminClient();

  await adminClient
    .from("projects")
    .update({ estimated_delivery_date: newDate })
    .eq("id", projectId);

  if (note) {
    const { data: project } = await adminClient
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    await adminClient.from("project_updates").insert({
      project_id: projectId,
      status_from: project?.status || "",
      status_to: project?.status || "",
      note: `Delivery date updated to ${new Date(newDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. ${note}`,
      notify_client: true,
    });

    // Send email notification (was missing prefs check — now fixed)
    if (project && !project?.client_notifications_muted) {
      try {
        const { data: clientProfile } = await adminClient
          .from("profiles")
          .select("email, notification_preferences")
          .eq("id", project.client_id)
          .single();

        const prefs = (clientProfile?.notification_preferences as NotificationPreferences | null) ?? DEFAULT_NOTIFICATION_PREFERENCES;

        if (clientProfile?.email && prefs.status_updates) {
          const unsubscribeUrl = buildUnsubscribeUrl(project.client_id, "status_updates");
          await sendStatusUpdateEmail(clientProfile.email, {
            title: project.title,
            serviceType: "" as ServiceType,
            newStatus: project.status,
            statusLabel: `Delivery date updated`,
            note: `Delivery date updated to ${new Date(newDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. ${note}`,
            portalUrl: PORTAL_URL,
            unsubscribeUrl,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send delivery date email:", emailErr);
      }
    }
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
  const { user } = await requireAdmin();
  const adminClient = createAdminClient();

  const file = formData.get("file") as File;
  const documentType =
    (formData.get("document_type") as string) || "other";
  const clientVisible = formData.get("client_visible") !== "false";

  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > 50 * 1024 * 1024) throw new Error("File too large (max 50 MB)");

  // Upload to Supabase Storage using admin client (bypasses storage RLS)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${projectId}/${Date.now()}-${safeName}`;
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
  const { error: insertError } = await adminClient.from("project_documents").insert({
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

  // Send email notification for client-visible documents (skip if project-level mute is on)
  if (clientVisible) {
    try {
      const { data: project } = await adminClient
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (project && !project?.client_notifications_muted) {
        const { data: clientProfile } = await adminClient
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
  await requireAdmin();
  const adminClient = createAdminClient();

  await adminClient.from("project_milestones").insert({
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
  await requireAdmin();
  const adminClient = createAdminClient();

  const today = new Date().toISOString().split("T")[0];
  await adminClient
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
  await requireAdmin();
  const adminClient = createAdminClient();

  await adminClient
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
  await requireAdmin();
  const adminClient = createAdminClient();

  await adminClient
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
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: project } = await adminClient
    .from("projects")
    .select("start_date")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const estimatedDelivery =
    timelineDays && project.start_date
      ? calculateDeliveryDate(project.start_date, timelineDays)
      : null;

  await adminClient
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
  const { user } = await requireAdmin();
  const adminClient = createAdminClient();

  if (!body.trim()) throw new Error("Message cannot be empty");
  if (body.length > 10000) throw new Error("Message too long (max 10,000 characters)");

  // Fetch project info for email (admin client for JWT resilience)
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) {
    console.error("[SendAdminMessage] Project lookup error:", projectError.message, projectError.code, "| projectId:", projectId);
  }

  if (!project) throw new Error("Project not found");

  // Insert message
  const { error } = await adminClient.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    body: body.trim(),
    is_admin: true,
  });

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Notify client via email (skip if project-level mute is on)
  if (!project?.client_notifications_muted) {
    try {
      const { data: clientProfile } = await adminClient
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
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}

/* ── Mark Messages Read (Admin) ───────────────────────────── */

export async function markAdminMessagesRead(projectId: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Mark client messages (is_admin = false) as read
  await adminClient
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
  await requireAdmin(); // Verify caller is admin
  const supabase = createAdminClient(); // Use admin client to bypass RLS for calendar reads

  // Build date range for the month (with padding for next-month calendar rows)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  // Correctly calculate last day of the *next* month (for calendar padding rows)
  // new Date(year, month+1, 0) gives last day of the month after our target
  // JS Date handles year rollover automatically (month 13 → Jan next year)
  const endDateObj = new Date(year, month + 1, 0);
  const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

  const events: CalendarEvent[] = [];

  // Fetch projects with delivery dates in range (non-complete only)
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title, estimated_delivery_date, status, client_id, profiles(name, email)")
    .gte("estimated_delivery_date", startDate)
    .lte("estimated_delivery_date", endDate)
    .not("status", "in", '("complete","complete_granted")');

  console.log(`[calendar] range: ${startDate} → ${endDate}, projects: ${projects?.length ?? 'null'}, error: ${projectsError?.message ?? 'none'}`);
  if (projectsError) {
    console.error("Calendar projects query error:", projectsError);
  }

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
  const { data: milestones, error: milestonesError } = await supabase
    .from("project_milestones")
    .select("id, title, target_date, project_id, projects(title, client_id, profiles(name, email))")
    .gte("target_date", startDate)
    .lte("target_date", endDate)
    .is("completed_date", null);

  if (milestonesError) {
    console.error("Calendar milestones query error:", milestonesError);
  }

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

/* ── Toggle Project Notification Mute (Admin) ──────────────── */

export async function toggleProjectNotificationMute(
  projectId: string,
  target: "client" | "admin"
) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const column =
    target === "client"
      ? "client_notifications_muted"
      : "admin_notifications_muted";

  // Fetch current value
  const { data: project } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const currentValue = (project as Record<string, boolean>)[column];

  const { error: updateError } = await adminClient
    .from("projects")
    .update({ [column]: !currentValue })
    .eq("id", projectId);

  if (updateError) {
    console.error("[ToggleNotifMute] Update error (column may not exist):", updateError.message);
  }

  revalidatePath(`/admin/projects/${projectId}`);

  return { success: true };
}


/* ── Create Custom Offer ─────────────────────────────────────── */

const OFFER_BASE_URL = "https://www.alexander-ip.com/offer";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export async function createOffer(formData: FormData) {
  const { user } = await requireAdmin();
  const adminClient = createAdminClient();

  const clientEmail = formData.get("client_email") as string;
  const clientName = (formData.get("client_name") as string) || null;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const serviceType = (formData.get("service_type") as string) || "custom";
  const amountRaw = parseFloat(formData.get("amount") as string);
  const currency = (formData.get("currency") as string) || "USD";
  const timelineDaysRaw = formData.get("timeline_days") as string;
  const timelineDays = timelineDaysRaw ? parseInt(timelineDaysRaw, 10) : null;

  // Convert from whole currency (e.g. 850.00) to smallest unit (e.g. 85000 pence)
  const amount = Math.round(amountRaw * 100);

  if (!clientEmail || !title || !amount || amount < 50) {
    throw new Error("Missing required fields or invalid amount (minimum 0.50)");
  }

  // Insert offer (token auto-generated by DB default)
  const { data: offer, error: insertError } = await adminClient
    .from("offers")
    .insert({
      client_email: clientEmail,
      client_name: clientName,
      title,
      description,
      service_type: serviceType,
      amount,
      currency,
      timeline_days: timelineDays,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError || !offer) {
    throw new Error(
      `Failed to create offer: ${insertError?.message || "Unknown error"}`
    );
  }

  // Format amount for display
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  const formattedAmount = `${symbol}${amountRaw.toFixed(2)}`;
  const offerUrl = `${OFFER_BASE_URL}/${offer.token}`;

  // Send email
  try {
    await sendOfferEmail(clientEmail, {
      clientName,
      title,
      description,
      serviceType: serviceType as import("@/lib/supabase/types").ServiceType,
      formattedAmount,
      timelineDays,
      offerUrl,
    });
  } catch (emailErr) {
    console.error("Failed to send offer email:", emailErr);
  }

  revalidatePath("/admin/offers");

  return { success: true, offerId: offer.id };
}

/* ── Cancel Offer ──────────────────────────────────────────── */

export async function cancelOffer(offerId: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("offers")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("status", "pending");

  if (error) throw new Error(`Failed to cancel offer: ${error.message}`);

  revalidatePath("/admin/offers");
  return { success: true };
}

/* ── Resend Offer Email ────────────────────────────────────── */

export async function resendOfferEmail(offerId: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: offer } = await adminClient
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "pending") throw new Error("Can only resend pending offers");

  const symbol = CURRENCY_SYMBOLS[offer.currency] || "$";
  const formattedAmount = `${symbol}${(offer.amount / 100).toFixed(2)}`;
  const offerUrl = `${OFFER_BASE_URL}/${offer.token}`;

  await sendOfferEmail(offer.client_email, {
    clientName: offer.client_name,
    title: offer.title,
    description: offer.description,
    serviceType: offer.service_type as import("@/lib/supabase/types").ServiceType,
    formattedAmount,
    timelineDays: offer.timeline_days,
    offerUrl,
  });

  revalidatePath("/admin/offers");
  return { success: true };
}

/* ── Admin: Add Team Member ────────────────────────────────────── */

export async function addTeamMemberAdmin(projectId: string, email: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  email = email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Invalid email");

  let userId: string;

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: false,
      });
    if (createError)
      throw new Error(`Failed to create user: ${createError.message}`);
    userId = newUser.user.id;
  }

  const { data: existing } = await adminClient
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) throw new Error("Already a team member");

  const { error } = await adminClient.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: "member",
  });

  if (error) throw new Error(`Failed to add member: ${error.message}`);

  await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `https://www.alexander-ip.com/portal/projects/${projectId}`,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/* ── Admin: Remove Team Member ─────────────────────────────────── */

export async function removeTeamMemberAdmin(
  projectId: string,
  userId: string
) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to remove member: ${error.message}`);

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}
