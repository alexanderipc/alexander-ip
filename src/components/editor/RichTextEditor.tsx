"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Heading2,
  Code,
} from "lucide-react";

interface RichTextEditorProps {
  /** Current HTML value (controlled). Empty string clears the editor. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Submit on Enter (Shift+Enter for newline). Disabled by default for forms. */
  submitOnEnter?: boolean;
  onSubmit?: () => void;
  disabled?: boolean;
  /** Optional class for the outer wrapper. */
  className?: string;
  /** Min height of the content area, in px. */
  minHeight?: number;
  /** Max height of the content area, in px. */
  maxHeight?: number;
  /** Theme — "light" for white bg, "dark" for navy admin areas. */
  theme?: "light";
  /** Show the formatting toolbar above the editor. Default true. */
  showToolbar?: boolean;
}

/**
 * WYSIWYG rich-text editor backed by TipTap.
 * Outputs sanitized-ready HTML on every keystroke.
 *
 * Keyboard shortcuts (handled natively by TipTap):
 *   Ctrl/Cmd+B  bold
 *   Ctrl/Cmd+I  italic
 *   Ctrl/Cmd+U  underline
 *   Ctrl/Cmd+K  add link
 *   Ctrl/Cmd+Z  undo
 *   Ctrl/Cmd+Shift+Z  redo
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Type a message…",
  submitOnEnter = false,
  onSubmit,
  disabled = false,
  className = "",
  minHeight = 60,
  maxHeight = 240,
  showToolbar = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // SSR safety in Next.js app router
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        // Headings: only h2/h3 in chat — h1 is too dominant
        heading: { levels: [2, 3] },
        // We use our own Link extension below
        link: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false, // images are uploaded; we never store data: URIs
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // TipTap emits "<p></p>" for an empty editor; normalise to empty string
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-3 py-2 ${
          disabled ? "opacity-50" : ""
        }`,
        style: `min-height: ${minHeight}px; max-height: ${maxHeight}px; overflow-y: auto;`,
      },
      handleKeyDown(_view, event) {
        if (
          submitOnEnter &&
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          onSubmit
        ) {
          event.preventDefault();
          onSubmit();
          return true;
        }
        return false;
      },
    },
  });

  // Keep editor in sync when parent clears `value` (e.g. after a successful send)
  useEffect(() => {
    if (!editor) return;
    if (value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.clearContent();
    } else if (value && value !== editor.getHTML()) {
      // External set (e.g. draft restore on error). Avoid loops while typing.
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${className}`}
    >
      {showToolbar && editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

/* ── Toolbar ──────────────────────────────────────────────── */

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-slate-200 bg-slate-50 rounded-t-lg flex-wrap">
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bulleted list"
      >
        <List className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <Code className="w-3.5 h-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        onClick={() => {
          const previousUrl = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL:", previousUrl || "https://");
          if (url === null) return; // cancelled
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
        active={editor.isActive("link")}
        title="Add/edit link (Ctrl+K)"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-slate-300 mx-1" />;
}
