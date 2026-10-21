"use client";

import type { JSONContent, Editor as TiptapEditor } from "@tiptap/react";
import { cn } from "cn";
import { PinIcon, PinOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearDraft, loadDraft } from "@/components/editor/draft";
import { Editor } from "@/components/editor/editor";
import { Stat } from "@/components/editor/stat";
import { useWritingStats } from "@/components/editor/use-writing-stats";
import { Button } from "@/components/ui/button";
import { useStored } from "@/hooks/use-stored";
import { useTouch } from "@/hooks/use-touch";
import { remove } from "../actions";
import { DeleteDialog } from "./delete-dialog";
import { EditorHeader, headerModes, type HeaderMode } from "./editor-header";
import { FormattingToolbar } from "./formatting-toolbar";
import { LinkField } from "./link-field";
import { useSaver, type Phase, type Problem } from "./use-saver";

export type StoredDocument = {
  id: string;
  title: string;
  content: JSONContent;
  revision: number;
};

// Save feedback in the product's voice. Unsaved and Saved are announced;
// problems are shown next to the counters until a save settles them.
const statusCopy: Record<Phase, string> = {
  idle: "",
  unsaved: "Unsaved changes",
  saving: "Saving",
  saved: "Saved",
};
const problemCopy: Record<Problem, string> = {
  failed: "Not saved. The server blinked first. Save again.",
  warned: "Not saved yet. Trying again on your next change.",
  overwrote: "Edited elsewhere too. This version won.",
  changedElsewhere: "Changed elsewhere. Reload, or save to overwrite.",
  tooLarge: "Not saved. Over 1 MB: split it into two documents.",
  missing: "Not saved. This document was deleted elsewhere.",
};
const problemTone: Record<Problem, "warning" | "destructive"> = {
  failed: "destructive",
  warned: "warning",
  overwrote: "warning",
  changedElsewhere: "warning",
  tooLarge: "destructive",
  missing: "destructive",
};

const pins = ["pinned", "unpinned"] as const;
const REVEAL_EDGE_PX = 12;

/**
 * The chromeless editor: a page, a cursor and the counters. The header comes
 * on request (pointer at the top edge, Escape) and leaves on typing, as the
 * per-device header mode says; touch devices keep header and toolbar.
 */
export function DocumentEditor({ stored }: { stored?: StoredDocument }) {
  const router = useRouter();
  const touch = useTouch();
  const editorRef = useRef<TiptapEditor | null>(null);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const { stats, wpm, record, reset, restore } = useWritingStats();
  const [doc, setDoc] = useState(
    stored ? { id: stored.id, title: stored.title } : null,
  );

  const saver = useSaver({
    stored,
    editor: useCallback(() => editorRef.current, []),
    onCreated: (created) => {
      setDoc(created);
      history.replaceState(null, "", `/write/${created.id}`);
      clearDraft();
    },
  });
  const { save } = saver;

  // Chrome
  const [mode, setMode] = useStored<HeaderMode>(
    "blinker:header",
    "on-request",
    headerModes,
  );
  const [toolbarPin, setToolbarPin] = useStored(
    "blinker:toolbar",
    "unpinned",
    pins,
  );
  const [countersPin, setCountersPin] = useStored(
    "blinker:counters",
    "pinned",
    pins,
  );
  const [revealed, setRevealed] = useState<false | "pointer" | "key">(false);
  const [typed, setTyped] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [menus, setMenus] = useState(0);
  const [link, setLink] = useState<{ left: number; top: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const chrome = useRef<HTMLDivElement>(null);

  const headerShown =
    touch ||
    mode === "always" ||
    !!revealed ||
    (mode === "until-typing" && !typed);
  const toolbarPinned = toolbarPin === "pinned";
  const toolbarShown = touch || toolbarPinned || (toolbarOpen && headerShown);
  const countersPinned = countersPin === "pinned";
  const countersShown = countersPinned || headerShown;
  const busy = menus > 0 || deleting || !!link;

  const typing = useCallback(() => {
    setTyped(true);
    setRevealed(false);
  }, []);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save("manual");
      } else if (e.key === "Escape") {
        setRevealed((r) => r || "key");
      }
    };
    addEventListener("keydown", keydown);
    return () => removeEventListener("keydown", keydown);
  }, [save]);

  useEffect(() => {
    if (touch) return;
    const move = (e: MouseEvent) => {
      if (e.clientY <= REVEAL_EDGE_PX)
        return setRevealed((r) => r || "pointer");
      // Revealed by the pointer, gone when it walks away (unless in use).
      const bottom = chrome.current?.getBoundingClientRect().bottom ?? 0;
      const inUse = busy || chrome.current?.contains(document.activeElement);
      if (e.clientY > bottom + 80 && !inUse)
        setRevealed((r) => (r === "pointer" ? false : r));
    };
    addEventListener("mousemove", move);
    return () => removeEventListener("mousemove", move);
  }, [touch, busy]);

  const openLink = useCallback((e: TiptapEditor) => {
    const { from } = e.state.selection;
    const at = e.view.coordsAtPos(from);
    setLink({ left: at.left, top: at.bottom });
  }, []);

  const onCreate = (e: TiptapEditor) => {
    editorRef.current = e;
    setEditor(e);
    if (stored) return restore({ written: 0, elapsedMs: 0 }, e.getText());
    const draft = loadDraft();
    if (!draft) return;
    e.commands.setContent(draft.content, { emitUpdate: false });
    restore(draft.stats, e.getText());
    if (!e.isEmpty) saver.unsaved();
  };

  const deleteDocument = async () => {
    if (!doc) return;
    await remove(doc.id);
    saver.stop();
    router.replace("/app");
  };

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <div
        ref={chrome}
        className={cn(
          "z-40 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80",
          touch ? "sticky top-0" : "fixed inset-x-0 top-0",
          (headerShown || toolbarShown) && "border-b",
        )}
      >
        <header hidden={!headerShown}>
          <EditorHeader
            doc={doc}
            onRenamed={(title) => setDoc((d) => d && { ...d, title })}
            phase={saver.phase}
            problem={saver.problem}
            onSave={() => save("manual")}
            toolbar={toolbarShown}
            onToolbar={() => {
              if (toolbarShown) {
                setToolbarOpen(false);
                setToolbarPin("unpinned");
              } else setToolbarOpen(true);
            }}
            mode={mode}
            onMode={setMode}
            onDelete={() => setDeleting(true)}
            onBack={async (event) => {
              if (!saver.dirty()) return;
              event.preventDefault();
              if (
                (await saver.flush()) ||
                confirm("Unsaved changes. Leave anyway?")
              ) {
                saver.stop();
                router.push("/app");
              }
            }}
            onMenu={(open) => setMenus((n) => Math.max(0, n + (open ? 1 : -1)))}
            fixed={touch}
          />
        </header>
        {editor && (
          <div
            hidden={!toolbarShown}
            className={cn(headerShown && "border-t border-border/60")}
          >
            <FormattingToolbar
              editor={editor}
              onLink={() => openLink(editor)}
              pinnable={!touch}
              pinned={toolbarPinned}
              onPinnedChange={(p) => setToolbarPin(p ? "pinned" : "unpinned")}
              className="mx-auto h-12 max-w-[calc(68ch+4rem)] px-[clamp(8px,2vw,20px)]"
            />
          </div>
        )}
      </div>

      <main
        className={cn(
          "wrap flex flex-1 flex-col pb-6",
          // Room for header and toolbar, so revealing them covers no text.
          touch ? "pt-8" : "pt-[clamp(112px,16vh,160px)]",
        )}
      >
        <div
          className="doc mx-auto flex w-full max-w-[68ch] flex-1 flex-col"
          onKeyDown={(e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key.length === 1 || typingKeys.has(e.key)) typing();
          }}
        >
          <Editor
            label="Document"
            autofocus
            content={stored?.content}
            onCreate={onCreate}
            onUpdate={(e) => {
              record(e.getText());
              saver.changed();
            }}
            onLinkShortcut={openLink}
            className="flex-1 overflow-visible"
          />
          <p role="status" className="sr-only">
            {statusCopy[saver.phase]}
          </p>
          <div className="sticky bottom-0 mt-8 bg-background pt-3 pb-1">
            {saver.problem && (
              <div
                role="alert"
                className={cn(
                  "mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-3 px-4 py-2.5 text-[0.95rem]",
                  problemTone[saver.problem] === "warning"
                    ? "border-l-warning"
                    : "border-l-destructive",
                )}
              >
                <span className="flex-1">{problemCopy[saver.problem]}</span>
                {saver.problem === "changedElsewhere" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => location.reload()}
                  >
                    Reload
                  </Button>
                )}
              </div>
            )}
            <div
              hidden={!countersShown}
              className="flex items-center gap-x-4 border-t pt-3 sm:gap-x-7"
            >
              <Stat value={stats.words} label="words" />
              <Stat value={wpm} label="per minute" />
              <button
                type="button"
                onClick={reset}
                className="text-[0.95rem] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Reset stats
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={countersPinned ? "Unpin counters" : "Pin counters"}
                title={
                  countersPinned
                    ? "Unpin counters: show them with the header only"
                    : "Pin counters: keep them on screen"
                }
                onClick={() =>
                  setCountersPin(countersPinned ? "unpinned" : "pinned")
                }
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                {countersPinned ? <PinOffIcon /> : <PinIcon />}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {editor && link && (
        <LinkField editor={editor} at={link} onClose={() => setLink(null)} />
      )}
      {doc && (
        <DeleteDialog
          open={deleting}
          title={doc.title}
          onCancel={() => setDeleting(false)}
          onConfirm={deleteDocument}
        />
      )}
    </div>
  );
}

const typingKeys = new Set(["Enter", "Backspace", "Delete"]);
