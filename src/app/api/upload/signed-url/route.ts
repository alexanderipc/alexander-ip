import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessProject } from "@/lib/portal/access";

/**
 * Generate a signed upload URL so the browser can upload directly to Supabase Storage.
 * This bypasses the serverless function body-size / timeout limits for large files.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { projectId, filename, contentType } = await req.json();
    if (!projectId || !filename) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify access
    const hasAccess = await canAccessProject(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${projectId}/${Date.now()}-${safeName}`;

    // Determine proper content type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const resolvedContentType = mimeMap[ext] || contentType || "application/octet-stream";

    // Create signed upload URL (valid for 2 minutes)
    const { data, error } = await adminClient.storage
      .from("project-documents")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("[SignedURL] Error:", error.message);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      filePath,
      contentType: resolvedContentType,
    });
  } catch (err) {
    console.error("[SignedURL] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
