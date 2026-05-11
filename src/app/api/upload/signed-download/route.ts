import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessProject } from "@/lib/portal/access";

/**
 * Generate a short-lived signed download URL for a file in the
 * `project-documents` bucket.
 *
 * Used for chat / status-update attachments (stored as JSONB on the row
 * rather than as `project_documents` rows). The file path follows the
 * convention `{projectId}/{timestamp}-{filename}`, so we extract the
 * projectId and gate access on it.
 *
 * Admins always pass; clients must have access to the project.
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

    const { filePath } = (await req.json()) as { filePath?: string };
    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    // Path convention: {projectId}/{timestamp}-{filename}
    const projectId = filePath.split("/")[0];
    if (!projectId) {
      return NextResponse.json({ error: "Invalid filePath" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Admin bypass
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const hasAccess = await canAccessProject(user.id, projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { data, error } = await adminClient.storage
      .from("project-documents")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error("[signed-download] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
