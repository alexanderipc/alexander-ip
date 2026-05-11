/**
 * Server-side HTML sanitization for chat / status-update bodies written by
 * the TipTap rich-text editor.
 *
 * Allowlists exactly the tags + attributes the editor produces. Anything
 * else (scripts, inline event handlers, iframes, inline styles, etc.) is
 * stripped. This is the ONLY layer of sanitization — clients render the
 * stored HTML directly via dangerouslySetInnerHTML, so this function must
 * be called before every insert that writes `body_format='html'`.
 *
 * Server-only. Do not import from a "use client" component — the
 * underlying library is Node-only.
 */
import sanitizeHtml from "sanitize-html";

export function sanitizeMessageHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
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
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Force every <a> to open safely
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
    // No inline styles, no class names (Tailwind prose handles styling)
    allowedStyles: {},
  });
}

/**
 * Quick "is there any real content?" check for the editor's HTML output.
 * Returns false for an empty editor (`<p></p>`, whitespace-only, etc.).
 * Pure JS — safe to call from any environment.
 */
export function htmlHasContent(html: string): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length > 0;
}
