"use client";

import { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import type { MessageAttachment } from "./Attachment";

interface AttachmentUploaderProps {
  projectId: string;
  onUploaded: (att: MessageAttachment) => void;
  disabled?: boolean;
  /** Optional class on the trigger button */
  className?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — same limit as project documents

/**
 * Tiny paperclip button that uploads a file to the project's Supabase
 * Storage bucket and calls `onUploaded` with the attachment record.
 *
 * Re-uses the existing /api/upload/signed-url flow so the file ends up in
 * the same `project-documents` bucket as project documents — chat
 * attachments live alongside other files for the same project.
 */
export default function AttachmentUploader({
  projectId,
  onUploaded,
  disabled = false,
  className = "",
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} is too large (max 50 MB).`);
          continue;
        }
        const uploaded = await uploadFile(projectId, file);
        if (uploaded) onUploaded(uploaded);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title="Attach a file"
        className={`p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 ${className}`}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <span className="text-xs text-red-500 ml-2 self-center">{error}</span>
      )}
    </>
  );
}

/**
 * Upload a single file via the signed-URL pattern.
 * 1. Ask server for a signed upload URL (auth + project access checked)
 * 2. PUT the file to storage from the browser
 * 3. Return the attachment record
 */
async function uploadFile(
  projectId: string,
  file: File
): Promise<MessageAttachment | null> {
  // 1. Get signed URL
  const signRes = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      filename: file.name,
      contentType: file.type,
    }),
  });
  if (!signRes.ok) {
    console.error("[upload] signed-url failed:", signRes.status, await signRes.text());
    return null;
  }
  const { signedUrl, filePath, contentType } = (await signRes.json()) as {
    signedUrl: string;
    filePath: string;
    contentType: string;
  };

  // 2. PUT to storage
  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) {
    console.error("[upload] PUT failed:", putRes.status, await putRes.text());
    return null;
  }

  return {
    filename: file.name,
    file_url: filePath,
    mime_type: contentType,
    size: file.size,
  };
}
