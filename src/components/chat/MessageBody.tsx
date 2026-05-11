"use client";

import Markdown from "react-markdown";

interface MessageBodyProps {
  body: string;
  /** 'html' for new TipTap messages, 'markdown' for legacy rows. */
  bodyFormat: "html" | "markdown";
  /** Tailwind prose classes for the body wrapper — usually theme-dependent. */
  proseClassName?: string;
}

/**
 * Renders a chat / status-update body.
 *
 * HTML messages are rendered via dangerouslySetInnerHTML. We trust the
 * stored value because every write path runs through sanitizeMessageHtml
 * on the server before insert (see src/lib/sanitize-html.ts, called from
 * the server actions in src/app/{portal,admin}/actions.ts). Optimistic
 * local messages haven't been server-sanitized yet, but TipTap's schema
 * already constrains output to the allowlisted tags — it can't emit
 * <script> or event handlers in the first place.
 *
 * Legacy markdown rows go through react-markdown which doesn't render
 * raw HTML by default, so they're safe by construction.
 */
export default function MessageBody({
  body,
  bodyFormat,
  proseClassName = "",
}: MessageBodyProps) {
  if (bodyFormat === "html") {
    return (
      <div
        className={`prose prose-sm max-w-none ${proseClassName}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }
  return (
    <div className={`prose prose-sm max-w-none ${proseClassName}`}>
      <Markdown>{body}</Markdown>
    </div>
  );
}
