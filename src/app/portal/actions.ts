"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
