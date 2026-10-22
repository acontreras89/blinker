"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type LinkFieldProps = {
  editor: Editor;
  /** Where the selection starts, in viewport pixels. */
  at: { left: number; top: number };
  onClose: () => void;
};

/**
 * ⌘K or the toolbar's Link: a URL for the selection. With nothing selected
 * (and no link under the caret) it also asks for the text to link. Enter or
 * "Link" applies (an empty URL removes the link); Escape or leaving the
 * field gives the page back.
 */
export function LinkField({ editor, at, onClose }: LinkFieldProps) {
  const [href, setHref] = useState(
    () => (editor.getAttributes("link").href as string | undefined) ?? "",
  );
  const [needsText] = useState(
    () => editor.state.selection.empty && !editor.isActive("link"),
  );
  const [text, setText] = useState("");
  const box = useRef<HTMLFormElement>(null);

  const apply = () => {
    const url = withScheme(href.trim());
    const chain = editor.chain().focus();
    if (needsText) {
      const label = text.trim() || url;
      if (url)
        chain
          .insertContent({
            type: "text",
            text: label,
            marks: [{ type: "link", attrs: { href: url } }],
          })
          // Typing on after the link doesn't extend it.
          .unsetMark("link")
          .run();
      else chain.run();
    } else if (url) chain.extendMarkRange("link").setLink({ href: url }).run();
    else chain.extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <form
      ref={box}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        editor.commands.focus();
        onClose();
      }}
      // Leaving the whole box (not moving between its fields) closes it.
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget)) onClose();
      }}
      className="fixed z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-1.5 rounded-lg border bg-popover p-1.5 pl-3 shadow-md"
      style={{
        left: Math.max(16, Math.min(at.left, innerWidth - 432)),
        top: at.top + 8,
      }}
    >
      {needsText && (
        <input
          aria-label="Link text"
          placeholder="Text to show"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground"
        />
      )}
      <div className="flex items-center gap-2">
        <input
          type="url"
          aria-label="Link URL"
          placeholder="Paste a link"
          autoFocus={!needsText}
          value={href}
          onChange={(e) => setHref(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="sm">
          Link
        </Button>
      </div>
    </form>
  );
}

// "example.com" means the website, not a path on Blinker.
const withScheme = (url: string) =>
  !url || /^[a-z][a-z\d+.-]*:|^[/#]/i.test(url) ? url : `https://${url}`;
