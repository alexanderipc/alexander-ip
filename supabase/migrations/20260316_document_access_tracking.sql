-- Track when clients download/view documents
CREATE TABLE IF NOT EXISTS public.document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_access_log_doc
  ON public.document_access_log(document_id);

-- Add a convenience column on project_documents
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS last_client_access timestamptz;

-- RLS
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;
