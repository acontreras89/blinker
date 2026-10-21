"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";

type LinkFieldProps = {
  editor: Editor;
  /** Where the selection starts, in viewport pixels. */
  at: { left: number; top: number };
  onClose: () => void;
};

/**
 * ⌘K or the toolbar's Link: a URL for the selection. Enter applies (empty
 * removes the link), Escape or leaving the field gives the page back.
 */
export function LinkField({ editor, at, onClose }: LinkFieldProps) {
  const [href, setHref] = useState(
    () => (editor.getAttributes("link").href as string | undefined) ?? "",
  );

  const close = (apply: boolean) => {
    const chain = editor.chain().focus().extendMarkRange("link");
    if (apply && href.trim()) chain.setLink({ href: href.trim() }).run();
    else if (apply) chain.unsetLink().run();
    else editor.commands.focus();
    onClose();
  };

  return (
    <div
      className="fixed z-50 flex w-[min(24rem,calc(100vw-2rem))] items-center gap-2 rounded-lg border bg-popover p-1.5 pl-3 shadow-md"
      style={{
        left: Math.max(16, Math.min(at.left, innerWidth - 400)),
        top: at.top + 8,
      }}
    >
      <input
        type="url"
        aria-label="Link URL"
        placeholder="Paste a link, press Enter"
        autoFocus
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            close(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            close(false);
          }
        }}
        onBlur={onClose}
        className="min-w-0 flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground"
      />
      <kbd className="shrink-0 rounded-md border border-b-2 bg-muted px-1.5 text-[0.8rem] font-semibold text-muted-foreground">
        Enter
      </kbd>
    </div>
  );
}
