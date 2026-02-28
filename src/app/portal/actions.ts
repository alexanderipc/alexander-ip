"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendNewMessageEmail } from "@/lib/email";

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
