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

/* ── Client-side sanitizer ──────────────────────────────────
 * Lightweight sanitizer for optimistic message rendering.
 * Uses regex-based tag stripping — mirrors the server-side allowlist.
 * Safe to import from "use client" components (no Node dependencies).
 *
 * This is NOT a replacement for server-side sanitization — it is a
 * defence-in-depth layer so optimistic renders don't display raw
 * unsanitized HTML before the server round-trip completes.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "blockquote", "h1", "h2", "h3", "ul", "ol", "li", "pre",
  "strong", "em", "u", "s", "code", "a", "img",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title"]),
};

export function sanitizeHtmlClient(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === 1) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Replace disallowed element with its text content
        const text = document.createTextNode(el.textContent || "");
        node.replaceChild(text, child);
        continue;
      }
      // Strip disallowed attributes
      const allowedForTag = ALLOWED_ATTRS[tag] || new Set<string>();
      for (const attr of Array.from(el.attributes)) {
        if (!allowedForTag.has(attr.name)) {
          el.removeAttribute(attr.name);
        }
      }
      // Validate href/src schemes
      if (tag === "a") {
        const href = el.getAttribute("href") || "";
        if (!/^https?:\/\/|^mailto:/i.test(href) && !href.startsWith("/")) {
          el.removeAttribute("href");
        }
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      if (tag === "img") {
        const src = el.getAttribute("src") || "";
        if (!/^https?:\/\//i.test(src)) {
          el.removeAttribute("src");
        }
      }
      sanitizeNode(el);
    }
  }
}
