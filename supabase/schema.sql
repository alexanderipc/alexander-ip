-- ============================================================
-- Alexander IP Client Portal — Database Schema
-- Run this in the Supabase SQL Editor after creating the project.
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'client');

CREATE TYPE service_type AS ENUM (
  'consultation',
  'patent_search',
  'patent_drafting',
  'patent_prosecution',
  'international_filing',
  'custom',
  'fto',
  'illustrations',
  'filing',
  'ip_valuation'
);

CREATE TYPE document_type AS ENUM (
  'patent_application',
  'office_action',
  'response',
  'search_report',
  'filing_receipt',
  'invoice',
  'correspondence',
  'illustration',
  'other'
);

CREATE TYPE relationship_type AS ENUM (
  'continuation',
  'divisional',
  'pct_national_phase',
  'related',
  'search_then_draft'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  name TEXT,
  email TEXT,
  company TEXT,
  phone TEXT,
  notes TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{"status_updates": true, "document_uploads": true, "new_messages": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  service_type service_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'payment_received',
  jurisdictions TEXT[] DEFAULT '{}',
  start_date DATE DEFAULT CURRENT_DATE,
  default_timeline_days INTEGER,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  price_paid INTEGER,          -- in smallest currency unit (cents/pence)
  currency TEXT DEFAULT 'USD',
  stripe_payment_id TEXT,
  client_notifications_muted BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notifications_muted BOOLEAN NOT NULL DEFAULT FALSE,
  onedrive_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project updates (status change log + notes)
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  note TEXT,                    -- client-visible note
  internal_note TEXT,           -- admin-only note
  notify_client BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project documents
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type document_type NOT NULL DEFAULT 'other',
  client_visible BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- Project milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE,
  completed_date DATE,
  is_client_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project messages (direct messaging between admin and client)
CREATE TABLE project_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Linked projects
CREATE TABLE linked_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_a_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_b_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_a_id, project_b_id)
);

-- OAuth tokens (for OneDrive integration — admin only)
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project members (team access — multiple clients per project)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_delivery ON projects(estimated_delivery_date);
CREATE INDEX idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON project_messages(created_at);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Helper: check admin role without triggering RLS recursion on profiles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Profiles ────────────────────────────────────────────────

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ── Helper: check project membership ──────────────────────
-- Used in RLS policies — checks project_members OR legacy client_id

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

-- ── Projects ────────────────────────────────────────────────

CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can do everything on projects"
  ON projects FOR ALL
  USING (is_admin());

-- ── Project Members ──────────────────────────────────────────

CREATE POLICY "Members can view their memberships"
  ON project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can invite members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "Admins can do everything on project_members"
  ON project_members FOR ALL
  USING (is_admin());

-- ── Project Updates ─────────────────────────────────────────

CREATE POLICY "Clients can view own project updates"
  ON project_updates FOR SELECT
  USING (is_project_member(project_id));

CREATE POLICY "Admins can do everything on project_updates"
  ON project_updates FOR ALL
  USING (is_admin());

-- ── Project Documents ───────────────────────────────────────

CREATE POLICY "Clients can view visible documents"
  ON project_documents FOR SELECT
  USING (client_visible = TRUE AND is_project_member(project_id));

CREATE POLICY "Admins can do everything on documents"
  ON project_documents FOR ALL
  USING (is_admin());

-- ── Project Milestones ──────────────────────────────────────

CREATE POLICY "Clients can view visible milestones"
  ON project_milestones FOR SELECT
  USING (is_client_visible = TRUE AND is_project_member(project_id));

CREATE POLICY "Admins can do everything on milestones"
  ON project_milestones FOR ALL
  USING (is_admin());

-- ── Project Messages ──────────────────────────────────────────

CREATE POLICY "Clients can view own project messages"
  ON project_messages FOR SELECT
  USING (is_project_member(project_id));

CREATE POLICY "Clients can send messages on own projects"
  ON project_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND is_project_member(project_id)
  );

CREATE POLICY "Clients can mark admin messages as read"
  ON project_messages FOR UPDATE
  USING (is_admin = TRUE AND is_project_member(project_id))
  WITH CHECK (is_admin = TRUE AND is_project_member(project_id));

CREATE POLICY "Admins can do everything on messages"
  ON project_messages FOR ALL
  USING (is_admin());

-- ── Linked Projects ─────────────────────────────────────────

CREATE POLICY "Clients can view linked projects"
  ON linked_projects FOR SELECT
  USING (
    is_project_member(project_a_id) OR is_project_member(project_b_id)
  );

CREATE POLICY "Admins can do everything on linked_projects"
  ON linked_projects FOR ALL
  USING (is_admin());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Prevent clients from escalating their own role
CREATE OR REPLACE FUNCTION protect_role_field()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow role changes if the caller is already an admin
  -- Regular users (via anon key + RLS) cannot change their role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT is_admin() THEN
      NEW.role := OLD.role;  -- silently revert
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER protect_profiles_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_role_field();
