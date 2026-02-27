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
import type { ServiceType } from "@/lib/supabase/types";

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

  // TODO: Send email notification via Resend when configured
  console.log(
    `[EMAIL] Project created for ${clientEmail}: "${title}" (${serviceType})`
  );

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

  // TODO: Send email if notifyClient
  if (notifyClient) {
    console.log(
      `[EMAIL] Status advanced for project ${projectId}: ${project.status} → ${nextStatus}`
    );
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
    .select("status")
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

  if (notifyClient) {
    console.log(`[EMAIL] Update added for project ${projectId}`);
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

  const file = formData.get("file") as File;
  const documentType =
    (formData.get("document_type") as string) || "other";
  const clientVisible = formData.get("client_visible") !== "false";

  if (!file || file.size === 0) throw new Error("No file provided");

  // Upload to Supabase Storage
  const filePath = `${projectId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get the public URL (or signed URL for private buckets)
  const {
    data: { publicUrl },
  } = supabase.storage.from("project-documents").getPublicUrl(filePath);

  // Create document record
  await supabase.from("project_documents").insert({
    project_id: projectId,
    filename: file.name,
    file_url: publicUrl,
    document_type: documentType as import("@/lib/supabase/types").DocumentType,
    client_visible: clientVisible,
    uploaded_by: user.id,
  });

  if (clientVisible) {
    console.log(
      `[EMAIL] Document uploaded for project ${projectId}: ${file.name}`
    );
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
