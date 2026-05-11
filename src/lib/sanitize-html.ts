/**
 * HTML sanitization for chat / status-update bodies written by the
 * TipTap rich-text editor. Allowlists exactly the tags + attributes
 * the editor produces. Anything else (scripts, inline event handlers,
 * iframes, etc.) is stripped.
 *
 * Used on the server before inserting a row, and on the client before
 * rendering with `dangerouslySetInnerHTML` (defence in depth).
 */
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  // block
  "p",
  "br",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "pre",
  // inline
  "strong",
  "em",
  "u",
  "s",
  "code",
  "a",
  "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title"];

export function sanitizeMessageHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Force every <a> to open safely
    ADD_ATTR: ["target", "rel"],
    // Block all event handlers and javascript: URLs
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    // Drop empty whole document wrappers TipTap occasionally emits
    FORBID_TAGS: ["html", "head", "body", "script", "iframe", "style"],
  });
}

/**
 * Quick "is there any real content?" check for the editor's HTML output.
 * Returns false for an empty editor (`<p></p>`, whitespace-only, etc.).
 */
export function htmlHasContent(html: string): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length > 0;
}
