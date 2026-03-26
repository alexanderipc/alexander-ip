-- Add last_client_visit column to projects for tracking when clients last viewed their portal
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS last_client_visit timestamptz;

-- Index for quick lookup of projects by last visit (admin dashboard sorting)
CREATE INDEX IF NOT EXISTS idx_projects_last_client_visit
  ON public.projects(last_client_visit);
