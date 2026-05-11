"use client";

import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Download, X, Loader2 } from "lucide-react";
import { isImage, humanSize, type MessageAttachment } from "./Attachment";

interface AttachmentListProps {
  attachments: MessageAttachment[];
  /** When true, show a remove (X) button — for the compose area. */
  removable?: boolean;
  onRemove?: (index: number) => void;
  /** Tone — "light" for slate bubble, "dark" for navy admin bubble. */
  tone?: "light" | "dark";
}

/**
 * Renders a list of attachments. Images appear as thumbnails (click to open
 * full-size in a new tab), other files appear as download chips.
 *
 * Asks the server for a short-lived signed URL per file (server route
 * /api/upload/signed-download). Cached per render — refreshed on remount.
 */
export default function AttachmentList({
  attachments,
  removable = false,
  onRemove,
  tone = "light",
}: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((att, i) =>
        isImage(att) ? (
          <ImageAttachment
            key={`${att.file_url}-${i}`}
            attachment={att}
            removable={removable}
            onRemove={onRemove ? () => onRemove(i) : undefined}
          />
        ) : (
          <FileAttachment
            key={`${att.file_url}-${i}`}
            attachment={att}
            removable={removable}
            onRemove={onRemove ? () => onRemove(i) : undefined}
            tone={tone}
          />
        )
      )}
    </div>
  );
}

/* ── Image thumbnail ─────────────────────────────────────── */

function ImageAttachment({
  attachment,
  removable,
  onRemove,
}: {
  attachment: MessageAttachment;
  removable: boolean;
  onRemove?: () => void;
}) {
  const url = useSignedDownloadUrl(attachment.file_url);

  return (
    <div className="relative group">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          title={attachment.filename}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={attachment.filename}
            className="rounded-md max-h-48 max-w-xs border border-slate-200 object-cover"
          />
        </a>
      ) : (
        <div className="w-32 h-24 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
      )}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ── Generic file chip ───────────────────────────────────── */

function FileAttachment({
  attachment,
  removable,
  onRemove,
  tone,
}: {
  attachment: MessageAttachment;
  removable: boolean;
  onRemove?: () => void;
  tone: "light" | "dark";
}) {
  const url = useSignedDownloadUrl(attachment.file_url);
  const Icon = attachment.mime_type?.startsWith("image/") ? ImageIcon : FileText;

  const chipCls =
    tone === "dark"
      ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";

  const content = (
    <>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{attachment.filename}</div>
        {attachment.size > 0 && (
          <div className="text-[10px] opacity-60">{humanSize(attachment.size)}</div>
        )}
      </div>
      {!removable && url && <Download className="w-3.5 h-3.5 opacity-50" />}
    </>
  );

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm max-w-xs ${chipCls} relative group`}
    >
      {url && !removable ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.filename}
          className="inline-flex items-center gap-2 min-w-0 flex-1"
          title={attachment.filename}
        >
          {content}
        </a>
      ) : (
        <div className="inline-flex items-center gap-2 min-w-0 flex-1">
          {content}
        </div>
      )}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ── Signed-URL hook ─────────────────────────────────────── */

function useSignedDownloadUrl(filePath: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/upload/signed-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.url) setUrl(data.url);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filePath]);
  return url;
}
