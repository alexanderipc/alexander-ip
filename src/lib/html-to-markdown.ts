/**
 * Lightweight HTML → Markdown converter for paste events.
 * Handles the common cases: bold, italic, lists, links, headings, line breaks.
 * No external dependencies.
 */

export function htmlToMarkdown(html: string): string {
  // Create a temporary DOM element to parse HTML
  if (typeof document === "undefined") return html;

  const div = document.createElement("div");
  div.innerHTML = html;

  return nodeToMarkdown(div).trim();
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Get children content
  const children = Array.from(el.childNodes)
    .map(nodeToMarkdown)
    .join("");

  switch (tag) {
    // Bold
    case "b":
    case "strong":
      return `**${children.trim()}**`;

    // Italic
    case "i":
    case "em":
      return `*${children.trim()}*`;

    // Underline — no Markdown equivalent, just pass through
    case "u":
      return children;

    // Strikethrough
    case "s":
    case "del":
    case "strike":
      return `~~${children.trim()}~~`;

    // Links
    case "a": {
      const href = el.getAttribute("href");
      if (href) return `[${children.trim()}](${href})`;
      return children;
    }

    // Headings
    case "h1":
      return `\n# ${children.trim()}\n`;
    case "h2":
      return `\n## ${children.trim()}\n`;
    case "h3":
      return `\n### ${children.trim()}\n`;
    case "h4":
    case "h5":
    case "h6":
      return `\n#### ${children.trim()}\n`;

    // Paragraphs
    case "p":
      return `\n${children.trim()}\n`;

    // Line breaks
    case "br":
      return "\n";

    // Unordered lists
    case "ul":
      return "\n" + Array.from(el.children)
        .map((li) => `- ${nodeToMarkdown(li).trim()}`)
        .join("\n") + "\n";

    // Ordered lists
    case "ol":
      return "\n" + Array.from(el.children)
        .map((li, i) => `${i + 1}. ${nodeToMarkdown(li).trim()}`)
        .join("\n") + "\n";

    // List items (handled by parent ul/ol, but just in case)
    case "li":
      return children;

    // Blockquote
    case "blockquote":
      return "\n" + children.trim().split("\n").map((line) => `> ${line}`).join("\n") + "\n";

    // Code
    case "code":
      return `\`${children}\``;

    // Preformatted
    case "pre":
      return `\n\`\`\`\n${children.trim()}\n\`\`\`\n`;

    // Divs, spans, and other containers — just pass through children
    case "div":
      return `\n${children}`;

    case "span":
      return children;

    // Tables — simplified
    case "table":
    case "tbody":
    case "thead":
      return children;
    case "tr":
      return Array.from(el.children)
        .map((td) => nodeToMarkdown(td).trim())
        .join(" | ") + "\n";
    case "td":
    case "th":
      return children;

    // Images
    case "img": {
      const alt = el.getAttribute("alt") || "";
      const src = el.getAttribute("src") || "";
      if (src) return `![${alt}](${src})`;
      return "";
    }

    // Horizontal rule
    case "hr":
      return "\n---\n";

    default:
      return children;
  }
}

/**
 * Checks if clipboard has HTML content, and if so converts to Markdown.
 * Returns null if no HTML found (caller should use default paste behavior).
 */
export function getMarkdownFromClipboard(
  e: React.ClipboardEvent
): string | null {
  const html = e.clipboardData.getData("text/html");
  if (!html) return null;

  const md = htmlToMarkdown(html);

  // If the conversion produced something meaningfully different from plain text,
  // use the markdown version. Otherwise fall back to default paste.
  const plain = e.clipboardData.getData("text/plain");
  if (md.replace(/\s+/g, " ").trim() === plain.replace(/\s+/g, " ").trim()) {
    return null; // No formatting detected, use default paste
  }

  return md;
}
