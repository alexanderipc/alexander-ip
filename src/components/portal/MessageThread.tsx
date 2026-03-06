"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

  // Mark unread admin messages as read when component mounts
  useEffect(() => {
    const hasUnread = messages.some((m) => m.is_admin && !m.read_at);
    if (hasUnread) {
      markMessagesRead(projectId).catch(console.error);
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
      is_admin: false,
      read_at: null,
      created_at: new Date().toISOString(),
      sender_id: userId,
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    setBody("");

    startTransition(async () => {
      try {
        await sendClientMessage(projectId, messageText);
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
            No messages yet. Send a message to start a conversation.
          </p>
        ) : (
          sorted.map((msg) => {
            const isMe = msg.sender_id === userId;
            const isOptimistic = msg.id.startsWith("optimistic-");
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
                  } ${isOptimistic ? "opacity-70" : ""}`}
                >
                  {!isMe && (
                    <p className="text-[11px] font-medium text-blue-600 mb-0.5">
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
          placeholder="Type a message..."
          rows={2}
          maxLength={2000}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || isPending}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-end"
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
