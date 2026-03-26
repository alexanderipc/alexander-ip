import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessProject } from "@/lib/portal/access";

/**
 * POST /api/portal/visit
 * Records when a client visits their project page.
 * Updates `last_client_visit` on the project row.
 */
export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify access
    const hasAccess = await canAccessProject(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Check if user is admin — don't track admin visits
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      return NextResponse.json({ ok: true });
    }

    // Update last_client_visit on the project
    await adminClient
      .from("projects")
      .update({ last_client_visit: new Date().toISOString() })
      .eq("id", projectId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PortalVisit] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
