"use client";

import type { Editor as TiptapEditor } from "@tiptap/react";
import { loadDraft } from "@/components/editor/draft";
import { Editor } from "@/components/editor/editor";
import { Stat } from "@/components/editor/stat";
import { useWritingStats } from "@/components/editor/use-writing-stats";

// A blank page that picks up the landing draft. Saving it as a document, and
// the chromeless header, are E5.
export function Writer() {
  const { stats, wpm, record, restore } = useWritingStats();

  const onCreate = (e: TiptapEditor) => {
    const draft = loadDraft();
    if (!draft) return;
    e.commands.setContent(draft.content, { emitUpdate: false });
    restore(draft.stats, e.getText());
  };

  return (
    <div className="wrap flex flex-1 flex-col pt-[clamp(24px,6vh,72px)] pb-6">
      <div className="mx-auto flex w-full max-w-[68ch] flex-1 flex-col">
        <Editor
          label="Document"
          autofocus
          onCreate={onCreate}
          onUpdate={(e) => record(e.getText())}
          className="flex-1"
        />
        <div className="sticky bottom-0 mt-8 flex gap-7 border-t bg-background pt-4">
          <Stat value={stats.words} label="words" />
          <Stat value={wpm} label="per minute" />
        </div>
      </div>
    </div>
  );
}
