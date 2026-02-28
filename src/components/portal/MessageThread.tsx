"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { sendClientMessage, markMessagesRead } from "@/app/portal/actions";
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
  userId: string;
}

export default function MessageThread({
  projectId,
  messages,
  userId,
}: MessageThreadProps) {
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark unread admin messages as read when component mounts
  useEffect(() => {
    const hasUnread = messages.some((m) => m.is_admin && !m.read_at);
    if (hasUnread) {
      markMessagesRead(projectId).catch(console.error);
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
        await sendClientMessage(projectId, body.trim());
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

  return (
    <div>
      {/* Message list */}
      <div className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-1">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">
            No messages yet. Send a message to start a conversation.
          </p>
        ) : (
          sorted.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                    isMe
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {!isMe && (
                    <p
                      className={`text-[11px] font-medium mb-0.5 ${
                        isMe ? "text-blue-200" : "text-blue-600"
                      }`}
                    >
                      Alexander IP
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.body}
                  </p>
                  <time
                    className={`text-[10px] mt-1 block ${
                      isMe ? "text-blue-200" : "text-slate-400"
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
          placeholder="Type a message..."
          rows={1}
          maxLength={2000}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || isPending}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {isPending && (
        <p className="text-xs text-slate-400 mt-1">Sending...</p>
      )}
    </div>
  );
}
