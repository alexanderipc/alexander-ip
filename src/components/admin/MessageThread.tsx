"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  // Merge server messages with optimistic ones
  const serverIds = new Set(messages.map((m) => m.id));
  const pendingOptimistic = optimisticMessages.filter(
    (m) => !serverIds.has(m.id)
  );
  const allMessages = [...messages, ...pendingOptimistic];

  const sorted = [...allMessages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Scroll to bottom of the message container (not the page)
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Mark unread client messages as read when component mounts
  useEffect(() => {
    const hasUnread = messages.some((m) => !m.is_admin && !m.read_at);
    if (hasUnread) {
      markAdminMessagesRead(projectId).catch(console.error);
    }
  }, [projectId, messages]);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    if (messages.length !== prevCountRef.current || pendingOptimistic.length > 0) {
      scrollToBottom();
      prevCountRef.current = messages.length;
    }
  }, [messages.length, pendingOptimistic.length, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Poll for new messages every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  // Clean up optimistic messages that are now in server data
  useEffect(() => {
    if (optimisticMessages.length > 0 && serverIds.size > 0) {
      const remaining = optimisticMessages.filter((m) => !serverIds.has(m.id));
      if (remaining.length !== optimisticMessages.length) {
        setOptimisticMessages(remaining);
      }
    }
  }, [messages, optimisticMessages, serverIds]);

  function handleSend() {
    if (!body.trim() || isPending) return;
    setError(null);

    const messageText = body.trim();

    // Add optimistic message immediately
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      body: messageText,
      is_admin: true,
      read_at: null,
      created_at: new Date().toISOString(),
      sender_id: "admin",
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    setBody("");

    startTransition(async () => {
      try {
        await sendAdminMessage(projectId, messageText);
        router.refresh();
      } catch (err) {
        // Remove optimistic message on error
        setOptimisticMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMsg.id)
        );
        setBody(messageText);
        setError(
          err instanceof Error ? err.message : "Failed to send message"
        );
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div>
      {/* Message list */}
      <div
        ref={containerRef}
        className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-1"
      >
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4 text-center">
            No messages yet. Send a message to the client.
          </p>
        ) : (
          sorted.map((msg) => {
            const isAdmin = msg.is_admin;
            const isOptimistic = msg.id.startsWith("optimistic-");
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
                  } ${isOptimistic ? "opacity-70" : ""}`}
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
          Enter to send &middot; Shift+Enter for new line
        </p>
        {body.length > 1800 && (
          <p
            className={`text-[11px] ${
              body.length >= 2000 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {body.length}/2000
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
