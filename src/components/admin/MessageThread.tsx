"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { sendAdminMessage, markAdminMessagesRead } from "@/app/admin/actions";
import { Send } from "lucide-react";

interface Message {
  id: string;
  body: string;
  is_admin: boolean;
  read_at: string | null;
  created_at: string;
  sender_id: string;
}

interface MessageThreadProps {
  projectId: string;
  messages: Message[];
  clientName: string;
}

export default function AdminMessageThread({
  projectId,
  messages,
  clientName,
}: MessageThreadProps) {
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark unread client messages as read when component mounts
  useEffect(() => {
    const hasUnread = messages.some((m) => !m.is_admin && !m.read_at);
    if (hasUnread) {
      markAdminMessagesRead(projectId).catch(console.error);
    }
  }, [projectId, messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!body.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        await sendAdminMessage(projectId, body.trim());
        setBody("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Show messages in chronological order (oldest first)
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const unreadCount = messages.filter((m) => !m.is_admin && !m.read_at).length;

  return (
    <div>
      {/* Message list */}
      <div className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-1">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">
            No messages yet. Send a message to the client.
          </p>
        ) : (
          sorted.map((msg) => {
            const isAdmin = msg.is_admin;
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                    isAdmin
                      ? "bg-navy text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {!isAdmin && (
                    <p className="text-[11px] font-medium text-blue-600 mb-0.5">
                      {clientName}
                      {!msg.read_at && (
                        <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      )}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.body}
                  </p>
                  <time
                    className={`text-[10px] mt-1 block ${
                      isAdmin ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleDateString("en-GB", {
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

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message client..."
          rows={2}
          maxLength={2000}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || isPending}
          className="px-3 py-2 rounded-lg bg-navy text-white hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-end"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-[11px] text-slate-400">
          {isPending ? "Sending..." : "Enter to send \u00B7 Shift+Enter for new line"}
        </p>
        {body.length > 1800 && (
          <p className={`text-[11px] ${body.length >= 2000 ? "text-red-500" : "text-slate-400"}`}>
            {body.length}/2000
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
