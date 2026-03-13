import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Check if a user can access a project (via project_members or legacy client_id).
 */
export async function canAccessProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const adminClient = createAdminClient();

  // Check project_members first
  const { data: membership } = await adminClient
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) return true;

  // Fallback: legacy client_id check
  const { data: project } = await adminClient
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_id", userId)
    .maybeSingle();

  return !!project;
}

/**
 * Get all project IDs a user can access.
 */
export async function getAccessibleProjectIds(
  userId: string
): Promise<string[]> {
  const adminClient = createAdminClient();

  // Get from project_members
  const { data: memberships } = await adminClient
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  const memberIds = new Set(
    (memberships || []).map((m) => m.project_id)
  );

  // Also get legacy client_id projects
  const { data: ownedProjects } = await adminClient
    .from("projects")
    .select("id")
    .eq("client_id", userId);

  for (const p of ownedProjects || []) {
    memberIds.add(p.id);
  }

  return Array.from(memberIds);
}
