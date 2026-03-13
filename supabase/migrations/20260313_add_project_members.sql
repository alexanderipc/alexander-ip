-- Migration: Add project_members table for multi-client project access
-- Run in Supabase SQL Editor

-- 1. Create table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

-- 3. Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 4. Helper function: check project membership (used in RLS)
CREATE OR REPLACE FUNCTION is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND client_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RLS policies for project_members
CREATE POLICY "Members can view their memberships"
  ON project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can invite members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

CREATE POLICY "Admins can do everything on project_members"
  ON project_members FOR ALL
  USING (is_admin());

-- 6. Update existing RLS policies to use project_members
-- Drop old client_id-only policies and recreate with membership checks

DROP POLICY IF EXISTS "Clients can view own projects" ON projects;
CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Clients can view own project updates" ON project_updates;
CREATE POLICY "Clients can view own project updates"
  ON project_updates FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Clients can view visible documents" ON project_documents;
CREATE POLICY "Clients can view visible documents"
  ON project_documents FOR SELECT
  USING (client_visible = TRUE AND is_project_member(project_id));

DROP POLICY IF EXISTS "Clients can view visible milestones" ON project_milestones;
CREATE POLICY "Clients can view visible milestones"
  ON project_milestones FOR SELECT
  USING (is_client_visible = TRUE AND is_project_member(project_id));

DROP POLICY IF EXISTS "Clients can view own project messages" ON project_messages;
CREATE POLICY "Clients can view own project messages"
  ON project_messages FOR SELECT
  USING (is_project_member(project_id));

DROP POLICY IF EXISTS "Clients can send messages on own projects" ON project_messages;
CREATE POLICY "Clients can send messages on own projects"
  ON project_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND is_project_member(project_id));

DROP POLICY IF EXISTS "Clients can mark admin messages as read" ON project_messages;
CREATE POLICY "Clients can mark admin messages as read"
  ON project_messages FOR UPDATE
  USING (is_admin = TRUE AND is_project_member(project_id))
  WITH CHECK (is_admin = TRUE AND is_project_member(project_id));

DROP POLICY IF EXISTS "Clients can view linked projects" ON linked_projects;
CREATE POLICY "Clients can view linked projects"
  ON linked_projects FOR SELECT
  USING (is_project_member(project_a_id) OR is_project_member(project_b_id));

-- 7. Backfill: create owner memberships for all existing projects
INSERT INTO project_members (project_id, user_id, role)
SELECT id, client_id, 'owner'
FROM projects
WHERE client_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;
