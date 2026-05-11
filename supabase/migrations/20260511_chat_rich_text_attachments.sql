-- Switch project chat + status updates to rich-text (HTML) with attachments.
--
-- body_format:
--   'markdown' — legacy rows; rendered with react-markdown
--   'html'     — new rows; sanitized HTML written by the TipTap editor
--
-- attachments: JSON array of { filename, file_url, mime_type, size }
--   file_url is the Supabase Storage path inside the 'project-documents'
--   bucket — same convention as project_documents.file_url.
--
-- Both columns get safe defaults so all existing rows continue to work
-- with no data backfill needed.

ALTER TABLE public.project_messages
  ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.project_messages
  DROP CONSTRAINT IF EXISTS project_messages_body_format_check;
ALTER TABLE public.project_messages
  ADD CONSTRAINT project_messages_body_format_check
    CHECK (body_format IN ('markdown', 'html'));

ALTER TABLE public.project_updates
  ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.project_updates
  DROP CONSTRAINT IF EXISTS project_updates_body_format_check;
ALTER TABLE public.project_updates
  ADD CONSTRAINT project_updates_body_format_check
    CHECK (body_format IN ('markdown', 'html'));
