"use client";

import type {
  AnyExtension,
  JSONContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
import { cn } from "cn";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Cursor } from "@/components/cursor";

// Tiptap can't prerender; the shell (size, placeholder) can, so the page
// paints the empty editor before the script loads.
const Tiptap = dynamic(() => import("./tiptap"), { ssr: false });

type EditorProps = {
  /** Accessible name of the text box. */
  label: string;
  placeholder?: string;
  /**
   * `display` starts at hero size and steps down to section size past ~2
   * lines (back up when emptied). `page` is the document size.
   */
  size?: "display" | "page";
  /** Focus on load, cursor at the end: the page is ready to type. */
  autofocus?: boolean;
  /** Off: readable and selectable, not typeable. Fixed at creation. */
  editable?: boolean;
  /** Initial content; later changes go through the editor's commands. */
  content?: JSONContent;
  onCreate?: (editor: TiptapEditor) => void;
  onUpdate?: (editor: TiptapEditor) => void;
  /** ⌘K: open a link field. Unset, the shortcut does nothing. */
  onLinkShortcut?: (editor: TiptapEditor) => void;
  /** Room kept around the caret while typing, for chrome over the page. */
  scrollMargin?: { top: number; bottom: number };
  /** A code block of its own (highlighted) instead of StarterKit's. */
  codeBlock?: AnyExtension;
  /** The scroll box: give it a max height and the content scrolls inside. */
  className?: string;
};

const sizes = {
  display: "text-display font-extrabold tracking-[-0.04em]",
  compact: "text-section font-extrabold tracking-[-0.03em]",
  page: "text-lg",
};

export function Editor({
  label,
  placeholder = "Start typing",
  size = "page",
  autofocus = false,
  editable = true,
  content,
  onCreate,
  onUpdate,
  onLinkShortcut,
  scrollMargin,
  codeBlock,
  className,
}: EditorProps) {
  // With content, the placeholder never shows: until Tiptap is in, the
  // cursor alone says the page is coming.
  const [loaded, setLoaded] = useState(false);
  const [empty, setEmpty] = useState(!hasText(content));
  const [compact, setCompact] = useState(false);
  const sync = (editor: TiptapEditor) => {
    setLoaded(true);
    setEmpty(editor.isEmpty);
    if (size !== "display") return;
    if (editor.isEmpty) return setCompact(false);
    const dom = editor.view.dom;
    const line = parseFloat(getComputedStyle(dom).lineHeight);
    if (dom.scrollHeight > line * 2.2) setCompact(true);
  };

  return (
    <div
      className={cn(
        "group relative flex min-h-[1lh] flex-col overflow-y-auto pb-[0.2em]",
        size === "display"
          ? sizes[compact ? "compact" : "display"]
          : sizes.page,
        empty ? "caret-transparent" : "caret-primary",
        className,
      )}
    >
      <Tiptap
        label={label}
        autofocus={autofocus && editable}
        editable={editable}
        content={content}
        onLinkShortcut={onLinkShortcut}
        scrollMargin={scrollMargin}
        codeBlock={codeBlock}
        onCreate={(editor) => {
          onCreate?.(editor);
          sync(editor);
        }}
        onUpdate={(editor) => {
          onUpdate?.(editor);
          sync(editor);
        }}
      />
      {!loaded && !empty && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Cursor />
        </div>
      )}
      {empty && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 group-focus-within:text-muted-foreground group-focus-within:opacity-50"
        >
          {placeholder}
          <Cursor />
        </div>
      )}
    </div>
  );
}

/** Whether stored content has anything to show (a blank doc has none). */
function hasText(content: JSONContent | undefined): boolean {
  if (!content) return false;
  if (content.text || content.type === "horizontalRule") return true;
  return content.content?.some(hasText) ?? false;
}
