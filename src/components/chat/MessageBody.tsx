"use client";

import Markdown from "react-markdown";
import { sanitizeMessageHtml } from "@/lib/sanitize-html";

interface MessageBodyProps {
  body: string;
  /** 'html' for new TipTap messages, 'markdown' for legacy rows. */
  bodyFormat: "html" | "markdown";
  /** Tailwind prose classes for the body wrapper — usually theme-dependent. */
  proseClassName?: string;
}

/**
 * Renders a chat / status-update body. HTML messages are sanitized (defence
 * in depth — the server also sanitises before storing) and rendered via
 * dangerouslySetInnerHTML; legacy markdown rows go through react-markdown.
 */
export default function MessageBody({
  body,
  bodyFormat,
  proseClassName = "",
}: MessageBodyProps) {
  if (bodyFormat === "html") {
    const clean = sanitizeMessageHtml(body);
    return (
      <div
        className={`prose prose-sm max-w-none ${proseClassName}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }
  return (
    <div className={`prose prose-sm max-w-none ${proseClassName}`}>
      <Markdown>{body}</Markdown>
    </div>
  );
}
