"use client";

import {
  EditorContent,
  useEditor,
  type Editor as TiptapEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

export type TiptapProps = {
  label: string;
  onCreate: (editor: TiptapEditor) => void;
  onUpdate: (editor: TiptapEditor) => void;
};

/** Client-only (Tiptap reads randomness while rendering); see editor.tsx. */
export default function Tiptap({ label, onCreate, onUpdate }: TiptapProps) {
  const callbacks = useRef({ onCreate, onUpdate });
  useEffect(() => {
    callbacks.current = { onCreate, onUpdate };
  });

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        spellcheck: "false",
      },
    },
    onCreate: ({ editor }) => callbacks.current.onCreate(editor),
    onUpdate: ({ editor }) => callbacks.current.onUpdate(editor),
  });

  return <EditorContent editor={editor} />;
}
