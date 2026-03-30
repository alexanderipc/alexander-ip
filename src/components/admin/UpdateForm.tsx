"use client";

import { useState, useTransition } from "react";
import { addUpdate } from "@/app/admin/actions";
import { getMarkdownFromClipboard } from "@/lib/html-to-markdown";

interface UpdateFormProps {
  projectId: string;
}

export default function UpdateForm({ projectId }: UpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);

  function handlePaste(setter: (v: string) => void, current: string) {
    return (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const md = getMarkdownFromClipboard(e);
      if (md !== null) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        setter(current.slice(0, start) + md + current.slice(end));
      }
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() && !internalNote.trim()) return;

    startTransition(async () => {
      await addUpdate(
        projectId,
        note || "(No client-visible note)",
        internalNote || undefined,
        notifyClient
      );
      setNote("");
      setInternalNote("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Client-visible note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onPaste={handlePaste(setNote, note)}
          rows={8}
          placeholder="Update for the client... (paste from Word/email — formatting is preserved)"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[160px]"
        />
        <p className="text-[11px] text-slate-400 mt-0.5">
          Supports Markdown — **bold**, *italic*, ## headings, - lists, [links](url)
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Internal note (admin only)
        </label>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          onPaste={handlePaste(setInternalNote, internalNote)}
          rows={2}
          placeholder="Private note..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={notifyClient}
            onChange={(e) => setNotifyClient(e.target.checked)}
            className="rounded border-slate-300"
          />
          Notify client
        </label>
        <button
          type="submit"
          disabled={isPending || (!note.trim() && !internalNote.trim())}
          className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Adding..." : "Add Update"}
        </button>
      </div>
    </form>
  );
}
