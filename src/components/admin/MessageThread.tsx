"use client";

import { useState, useTransition, useEffect, useRef, useOptimistic } from "react";
import { sendAdminMessage, markAdminMessagesRead } from "@/app/admin/actions";
import { Send } from "lucide-react";
import Markdown from "react-markdown";
import { getMarkdownFromClipboard } from "@/lib/html-to-markdown";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Optimistic messages — appear instantly before server confirms
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state: Message[], newMsg: Message) => [...state, newMsg]
  );

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
  }, [optimisticMessages.length]);

  function handleSend() {
    if (!body.trim() || isPending) return;
    const messageText = body.trim();
    setError(null);
    setBody("");

    // Focus back on input for quick follow-up messages
    textareaRef.current?.focus();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    startTransition(async () => {
      // Show message instantly
      addOptimistic({
        id: `optimistic-${Date.now()}`,
        body: messageText,
        is_admin: true,
        read_at: null,
        created_at: new Date().toISOString(),
        sender_id: "admin",
      });

      try {
        await sendAdminMessage(projectId, messageText);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setBody(messageText);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const md = getMarkdownFromClipboard(e);
    if (md !== null) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = body.slice(0, start);
      const after = body.slice(end);
      setBody(before + md + after);
    }
  }

  // Auto-resize textarea to fit content
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  // Show messages in chronological order (oldest first)
  const sorted = [...optimisticMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div>
      {/* Message list */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto mb-4 pr-1">
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
                  <div
                    className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                      isAdmin
                        ? "prose-invert prose-p:text-white prose-strong:text-white prose-li:text-white prose-a:text-blue-200 prose-headings:text-white"
                        : "prose-slate prose-a:text-blue-600"
                    } prose-p:my-1 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-ul:pl-4 prose-ol:pl-4 prose-headings:my-1.5 prose-pre:my-2 prose-blockquote:my-2`}
                  >
                    <Markdown>{msg.body}</Markdown>
                  </div>
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
        <div ref={bottomRef} />
      </div>

      {/* Input — compact chat-style */}
      <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Message client..."
          rows={1}
          maxLength={10000}
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
          style={{ minHeight: "40px", maxHeight: "200px" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || isPending}
          className="p-2.5 rounded-lg bg-navy text-white hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
        Enter to send · Shift+Enter for new line · Paste from Word/email preserves formatting
        {body.length > 9000 && (
          <span className={`ml-2 ${body.length >= 10000 ? "text-red-500" : ""}`}>
            {body.length.toLocaleString()}/10,000
          </span>
        )}
      </p>

      {error && (
        <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>
      )}
    </div>
  );
}
