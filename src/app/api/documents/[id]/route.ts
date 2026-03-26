import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessProject } from "@/lib/portal/access";

/**
 * Proxy document downloads to track client access.
 * GET /api/documents/[id] — redirects to a signed URL after logging access.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch the document
    const { data: doc, error } = await adminClient
      .from("project_documents")
      .select("id, project_id, file_url, filename")
      .eq("id", documentId)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify access
    const hasAccess = await canAccessProject(user.id, doc.project_id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user is admin
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Log access for non-admin users (clients)
    if (!isAdmin) {
      await adminClient.from("document_access_log").insert({
        document_id: documentId,
        user_id: user.id,
      });

      // Update last_client_access on the document
      await adminClient
        .from("project_documents")
        .update({ last_client_access: new Date().toISOString() })
        .eq("id", documentId);
    }

    // Generate signed URL and redirect
    const { data: urlData } = await adminClient.storage
      .from("project-documents")
      .createSignedUrl(doc.file_url, 3600);

    if (!urlData?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
    }

    return NextResponse.redirect(urlData.signedUrl);
  } catch (err) {
    console.error("[DocAccess] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
