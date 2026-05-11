/**
 * Shape of an attachment stored on a message or status update.
 * Stored as a JSONB array on `project_messages.attachments` / `project_updates.attachments`.
 *
 * file_url is the path inside the `project-documents` Supabase Storage bucket
 * (same convention as project_documents.file_url) — never a full URL, since
 * the bucket is private and we sign URLs on demand.
 */
export interface MessageAttachment {
  filename: string;
  file_url: string;
  mime_type: string;
  size: number;
}

export function isImage(att: MessageAttachment): boolean {
  return att.mime_type?.startsWith("image/") ?? false;
}

export function humanSize(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
