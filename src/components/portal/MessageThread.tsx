"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { sendClientMessage, markMessagesRead } from "@/app/portal/actions";
import { Send } from "lucide-react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import AttachmentUploader from "@/components/chat/AttachmentUploader";
import AttachmentList from "@/components/chat/AttachmentList";
import MessageBody from "@/components/chat/MessageBody";
import type { MessageAttachment } from "@/components/chat/Attachment";
import { sanitizeHtmlClient } from "@/lib/sanitize-html";

interface Message {
  id: string;
  body: string;
  body_format?: "markdown" | "html" | null;
  attachments?: MessageAttachment[] | null;
  is_admin: boolean;
  read_at: string | null;
  created_at: string;
  sender_id: string;
}

interface MessageThreadProps {
  projectId: string;
  messages: Message[];
  userId: string;
}

export default function MessageThread({
  projectId,
  messages,
  userId,
}: MessageThreadProps) {
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark unread admin messages as read when component mounts
  useEffect(() => {
    const hasUnread = messages.some((m) => m.is_admin && !m.read_at);
    if (hasUnread) {
      markMessagesRead(projectId).catch(console.error);
    }
  }, [projectId, messages]);

  // Combined view: server messages + messages sent in this session.
  // De-dupe by id so a server-revalidate that does include them doesn't double-up.
  const seen = new Set<string>();
  const combined: Message[] = [];
  for (const m of [...messages, ...sessionMessages]) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      combined.push(m);
    }
  }
  combined.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [combined.length]);

  function handleSend() {
    const trimmed = body.trim();
    const hasContent = trimmed !== "" && trimmed !== "<p></p>";
    if (!hasContent && pendingAttachments.length === 0) return;
    if (isPending) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      body: sanitizeHtmlClient(trimmed),
      body_format: "html",
      attachments: pendingAttachments,
      is_admin: false,
      read_at: null,
      created_at: new Date().toISOString(),
      sender_id: userId,
    };
    setSessionMessages((prev) => [...prev, optimistic]);
    setSendingId(optimisticId);
    setError(null);
    const sentAttachments = pendingAttachments;
    setBody("");
    setPendingAttachments([]);

    startTransition(async () => {
      try {
        const res = await sendClientMessage(projectId, trimmed, sentAttachments);
        if (res?.message) {
          // Swap optimistic with real row
          setSessionMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? (res.message as Message) : m))
          );
        }
        setSendingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        // Roll back the optimistic message; restore the draft so they can retry
        setSessionMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setSendingId(null);
        setBody(trimmed);
        setPendingAttachments(sentAttachments);
      }
    });
  }

  return (
    <div>
      {/* Message list */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto mb-4 pr-1">
        {combined.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">
            No messages yet. Send a message to start a conversation.
          </p>
        ) : (
          combined.map((msg) => {
            const isMe = msg.sender_id === userId;
            const isOptimistic = msg.id === sendingId;
            const attachments = msg.attachments ?? [];
            const proseClass = isMe
              ? "prose-invert prose-p:text-white prose-strong:text-white prose-li:text-white prose-a:text-blue-200 prose-headings:text-white"
              : "prose-slate prose-a:text-blue-600";
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                    isMe ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                  } ${isOptimistic ? "opacity-70" : ""}`}
                >
                  {!isMe && (
                    <p className="text-[11px] font-medium mb-0.5 text-blue-600">
                      Alexander IP
                    </p>
                  )}
                  {msg.body && (
                    <MessageBody
                      body={msg.body}
                      bodyFormat={msg.body_format === "html" ? "html" : "markdown"}
                      proseClassName={`text-sm leading-relaxed ${proseClass} prose-p:my-1 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-ul:pl-4 prose-ol:pl-4 prose-headings:my-1.5 prose-pre:my-2 prose-blockquote:my-2`}
                    />
                  )}
                  {attachments.length > 0 && (
                    <AttachmentList
                      attachments={attachments}
                      tone={isMe ? "dark" : "light"}
                    />
                  )}
                  <time
                    className={`text-[10px] mt-1 block ${
                      isMe ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {isOptimistic
                      ? "Sending..."
                      : new Date(msg.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </time>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2">
          <AttachmentList
            attachments={pendingAttachments}
            removable
            onRemove={(i) =>
              setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Type a message…"
            submitOnEnter
            onSubmit={handleSend}
            disabled={isPending}
            minHeight={48}
            maxHeight={200}
          />
        </div>
        <div className="flex items-center gap-1 self-end pb-0.5">
          <AttachmentUploader
            projectId={projectId}
            onUploaded={(att) =>
              setPendingAttachments((prev) => [...prev, att])
            }
            disabled={isPending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={
              isPending ||
              (body.trim() === "" && pendingAttachments.length === 0)
            }
            className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
        Enter to send · Shift+Enter for new line · Ctrl+B/I/U for formatting · Paste from Word preserves formatting
      </p>

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}
