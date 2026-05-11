"use client";

import { useState, useTransition } from "react";
import { addUpdate } from "@/app/admin/actions";
import RichTextEditor from "@/components/editor/RichTextEditor";
import AttachmentUploader from "@/components/chat/AttachmentUploader";
import AttachmentList from "@/components/chat/AttachmentList";
import type { MessageAttachment } from "@/components/chat/Attachment";

interface UpdateFormProps {
  projectId: string;
}

export default function UpdateForm({ projectId }: UpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [notifyClient, setNotifyClient] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const noteHasContent = note.trim() !== "" && note.trim() !== "<p></p>";
    const internalHasContent =
      internalNote.trim() !== "" && internalNote.trim() !== "<p></p>";
    if (!noteHasContent && !internalHasContent && attachments.length === 0) {
      setError("Add a note or attach a file before saving.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await addUpdate(
          projectId,
          noteHasContent ? note : "",
          internalHasContent ? internalNote : undefined,
          notifyClient,
          attachments
        );
        setNote("");
        setInternalNote("");
        setAttachments([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Client-visible note
        </label>
        <RichTextEditor
          value={note}
          onChange={setNote}
          placeholder="Update for the client… (Ctrl+B/I/U for formatting, or paste from Word)"
          disabled={isPending}
          minHeight={140}
          maxHeight={360}
        />
      </div>

      {attachments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Attachments</p>
          <AttachmentList
            attachments={attachments}
            removable
            onRemove={(i) =>
              setAttachments((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Internal note (admin only)
        </label>
        <RichTextEditor
          value={internalNote}
          onChange={setInternalNote}
          placeholder="Private note…"
          disabled={isPending}
          minHeight={60}
          maxHeight={200}
          showToolbar={false}
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <AttachmentUploader
            projectId={projectId}
            onUploaded={(att) => setAttachments((prev) => [...prev, att])}
            disabled={isPending}
            className="border border-slate-300 hover:bg-slate-50 rounded-md"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={notifyClient}
              onChange={(e) => setNotifyClient(e.target.checked)}
              className="rounded border-slate-300"
            />
            Notify client
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Adding…" : "Add Update"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
