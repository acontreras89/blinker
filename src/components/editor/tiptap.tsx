"use client";

import {
  type AnyExtension,
  EditorContent,
  Extension,
  textblockTypeInputRule,
  useEditor,
  type Editor as TiptapEditor,
  type JSONContent,
} from "@tiptap/react";
import { AllSelection, Selection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

export type TiptapProps = {
  label: string;
  autofocus: boolean;
  /** Fixed at creation, like `content`. */
  editable: boolean;
  content?: JSONContent;
  onCreate: (editor: TiptapEditor) => void;
  onUpdate: (editor: TiptapEditor) => void;
  /** ⌘K: the caller opens its link field. Unset, the shortcut does nothing. */
  onLinkShortcut?: (editor: TiptapEditor) => void;
  /** Room kept around the caret while typing, for chrome over the page. */
  scrollMargin?: { top: number; bottom: number };
  /** A code block of its own (highlighted) instead of StarterKit's. */
  codeBlock?: AnyExtension;
};

/** Client-only (Tiptap reads randomness while rendering); see editor.tsx. */
export default function Tiptap({
  label,
  autofocus,
  editable,
  content,
  onCreate,
  onUpdate,
  onLinkShortcut,
  scrollMargin,
  codeBlock,
}: TiptapProps) {
  const callbacks = useRef({ onCreate, onUpdate, onLinkShortcut });
  useEffect(() => {
    callbacks.current = { onCreate, onUpdate, onLinkShortcut };
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        underline: false,
        link: { openOnClick: false, defaultProtocol: "https" },
        ...(codeBlock && { codeBlock: false }),
      }),
      ...(codeBlock ? [codeBlock] : []),
      Shortcuts,
    ],
    content,
    editable,
    autofocus: autofocus && "end",
    editorProps: {
      ...(scrollMargin && {
        scrollMargin: { left: 0, right: 0, ...scrollMargin },
        scrollThreshold: { left: 0, right: 0, ...scrollMargin },
      }),
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        // A read-only text box says so; `contenteditable` alone doesn't.
        ...(!editable && { "aria-readonly": "true" }),
        spellcheck: "false",
      },
    },
    onCreate: ({ editor }) => callbacks.current.onCreate(editor),
    onUpdate: ({ editor }) => callbacks.current.onUpdate(editor),
  });

  useEffect(() => {
    const dom = editor?.view.dom;
    if (!dom) return;
    const claim = (event: Event) => {
      const open = callbacks.current.onLinkShortcut;
      if (!open) return;
      event.preventDefault();
      open(editor);
    };
    dom.addEventListener(LINK_EVENT, claim);
    return () => dom.removeEventListener(LINK_EVENT, claim);
  }, [editor]);

  // The text box fills its container: a click anywhere on the page types.
  return (
    <EditorContent editor={editor} className="flex flex-1 flex-col *:flex-1" />
  );
}

// What StarterKit leaves out or gets wrong for Blinker:
// - "```" opens a code block at once. The default rule waits for a space and
//   takes the word before it as the language, so "```let x" lost the "let".
// - An arrow key after ⌘A collapses the selection. ProseMirror leaves that to
//   the browser, which changes nothing in an empty document: the "all"
//   selection stayed and the next format applied to nothing.
// - ⌘K asks the page for a link: handled only if a listener claims the event.
const LINK_EVENT = "blinker:link";
const Shortcuts = Extension.create({
  name: "blinkerShortcuts",
  addInputRules() {
    const type = this.editor.schema.nodes.codeBlock;
    return [textblockTypeInputRule({ find: /^(```|~~~)$/, type })];
  },
  addKeyboardShortcuts() {
    const collapse = (toEnd: boolean) => () => {
      const { state, view } = this.editor;
      if (!(state.selection instanceof AllSelection)) return false;
      const to = toEnd
        ? Selection.atEnd(state.doc)
        : Selection.atStart(state.doc);
      view.dispatch(state.tr.setSelection(to).scrollIntoView());
      return true;
    };
    return {
      ArrowRight: collapse(true),
      ArrowDown: collapse(true),
      ArrowLeft: collapse(false),
      ArrowUp: collapse(false),
      "Mod-k": () =>
        !this.editor.view.dom.dispatchEvent(
          new Event(LINK_EVENT, { cancelable: true }),
        ),
    };
  },
});
