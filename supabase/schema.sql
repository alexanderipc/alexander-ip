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
  company TEXT,
  phone TEXT,
  notes TEXT,
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

-- Linked projects
CREATE TABLE linked_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_a_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_b_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_a_id, project_b_id)
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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_projects ENABLE ROW LEVEL SECURITY;

-- Helper: check admin role without triggering RLS recursion on profiles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

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

-- ── Projects ────────────────────────────────────────────────

CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admins can do everything on projects"
  ON projects FOR ALL
  USING (is_admin());

-- ── Project Updates ─────────────────────────────────────────

CREATE POLICY "Clients can view own project updates"
  ON project_updates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND client_id = auth.uid())
  );

CREATE POLICY "Admins can do everything on project_updates"
  ON project_updates FOR ALL
  USING (is_admin());

-- ── Project Documents ───────────────────────────────────────

CREATE POLICY "Clients can view visible documents"
  ON project_documents FOR SELECT
  USING (
    client_visible = TRUE AND
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND client_id = auth.uid())
  );

CREATE POLICY "Admins can do everything on documents"
  ON project_documents FOR ALL
  USING (is_admin());

-- ── Project Milestones ──────────────────────────────────────

CREATE POLICY "Clients can view visible milestones"
  ON project_milestones FOR SELECT
  USING (
    is_client_visible = TRUE AND
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND client_id = auth.uid())
  );

CREATE POLICY "Admins can do everything on milestones"
  ON project_milestones FOR ALL
  USING (is_admin());

-- ── Linked Projects ─────────────────────────────────────────

CREATE POLICY "Clients can view linked projects"
  ON linked_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE (id = project_a_id OR id = project_b_id)
        AND client_id = auth.uid()
    )
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
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
