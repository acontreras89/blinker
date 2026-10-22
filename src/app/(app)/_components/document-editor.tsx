"use client";

import type { JSONContent, Editor as TiptapEditor } from "@tiptap/react";
import { cn } from "cn";
import { PinIcon, PinOffIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  clearDraft,
  clearStats,
  loadDraft,
  loadStats,
  saveStats,
} from "@/lib/draft";
import { CodeHighlight } from "@/components/editor/code-highlight";
import { Editor } from "@/components/editor/editor";
import { Stat } from "@/components/editor/stat";
import { storeStats } from "@/lib/stats";
import { useWritingStats } from "@/hooks/use-writing-stats";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useStored } from "@/hooks/use-stored";
import { useTouch } from "@/hooks/use-touch";
import { brand } from "@/lib/brand";
import { remove } from "../actions";
import { startPaying } from "../billing/actions";
import { billingCopy } from "../billing/copy";
import { DeleteDialog } from "./delete-dialog";
import { EditorHeader, headerModes, type HeaderMode } from "./editor-header";
import { FormattingToolbar } from "./formatting-toolbar";
import { LinkField } from "./link-field";
import { SubscribeButton } from "./subscribe-button";
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
  lapsed: "Not saved: your subscription has ended. Your text stays right here.",
  trialLimit: `${billingCopy.trialLimit} ${billingCopy.trialLimitNext}`,
};
const problemTone: Record<Problem, "warning" | "destructive"> = {
  failed: "destructive",
  warned: "warning",
  overwrote: "warning",
  changedElsewhere: "warning",
  tooLarge: "destructive",
  missing: "destructive",
  lapsed: "destructive",
  trialLimit: "warning",
};

const pins = ["pinned", "unpinned"] as const;
const switches = ["on", "off"] as const;
/** How close to the top (or bottom) edge the pointer brings a hidden bar. */
const REVEAL_EDGE_PX = 64;
/** With the toolbar pinned up there, its buttons sit in that band: stay out. */
const REVEAL_EDGE_TOOLBAR_PX = 8;
/** How far past a bar the pointer goes before the bar leaves. */
const LEAVE_PX = 80;

type DocumentEditorProps = {
  stored?: StoredDocument;
  /** No subscription: the page reads, the way back to writing shows. */
  readOnly?: boolean;
  /** Read-only because the trial's documents are used up: pay to write. */
  capped?: boolean;
  /** They had a subscription: the way back is "resubscribe". */
  had: boolean;
};

/**
 * The chromeless editor: a page, a cursor and the counters. The header comes
 * on request (pointer at the top edge, Escape) and leaves on typing, as the
 * per-device header mode says; touch devices keep header and toolbar.
 */
export function DocumentEditor({
  stored,
  readOnly = false,
  capped = false,
  had,
}: DocumentEditorProps) {
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
      document.title = `${created.title} · ${brand.name}`;
      clearDraft();
    },
  });
  const { save } = saver;

  // The speed survives a reload, per document and device; nothing is stored
  // before the editor has read back what was.
  const statsLoaded = useRef(false);
  const persistStats = useEffectEvent(() => {
    if (doc && statsLoaded.current)
      saveStats(doc.id, storeStats(stats, Date.now()));
  });
  useEffect(() => persistStats(), [stats, doc]);
  useEffect(() => {
    addEventListener("pagehide", persistStats);
    return () => {
      removeEventListener("pagehide", persistStats);
      persistStats();
    };
  }, []);

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
  const [fireworks, setFireworks] = useStored(
    "blinker:fireworks",
    "off",
    switches,
  );
  const reduced = useReducedMotion();
  const pop = fireworks === "on" && !reduced;
  const [revealed, setRevealed] = useState<false | "pointer" | "key">(false);
  const [bottomRevealed, setBottomRevealed] = useState(false);
  const [typed, setTyped] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [menus, setMenus] = useState(0);
  const [link, setLink] = useState<{ left: number; top: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  // The pointer or the focus is on a bar: it stays until they leave it.
  const [onTop, setOnTop] = useState({ hover: false, focus: false });
  const [onBottom, setOnBottom] = useState(false);
  const chrome = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const busy = menus > 0 || deleting || !!link;
  const headerShown =
    touch ||
    mode === "always" ||
    !!revealed ||
    busy ||
    onTop.hover ||
    onTop.focus ||
    (mode === "until-typing" && !typed);
  const toolbarPinned = toolbarPin === "pinned";
  const toolbarOn = !readOnly && (touch || toolbarPinned || toolbarOpen);
  const toolbarShown = toolbarOn && (touch || toolbarPinned || headerShown);
  const countersPinned = countersPin === "pinned";
  const countersShown =
    touch || countersPinned || bottomRevealed || onBottom || revealed === "key";

  const typing = useCallback(() => {
    setTyped(true);
    setRevealed(false);
    setBottomRevealed(false);
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

  // The pointer at an edge brings that edge's bar; walking away takes it back.
  useEffect(() => {
    if (touch) return;
    const move = (e: MouseEvent) => {
      const edge = toolbarPinned ? REVEAL_EDGE_TOOLBAR_PX : REVEAL_EDGE_PX;
      if (e.clientY <= edge) setRevealed((r) => r || "pointer");
      else if (
        e.clientY >
        (chrome.current?.getBoundingClientRect().bottom ?? 0) + LEAVE_PX
      )
        setRevealed((r) => (r === "pointer" ? false : r));
      if (e.clientY >= innerHeight - REVEAL_EDGE_PX) setBottomRevealed(true);
      else if (
        e.clientY <
        (panel.current?.getBoundingClientRect().top ?? innerHeight) - LEAVE_PX
      )
        setBottomRevealed(false);
    };
    addEventListener("mousemove", move);
    return () => removeEventListener("mousemove", move);
  }, [touch, toolbarPinned]);

  const openLink = useCallback((e: TiptapEditor) => {
    const { from } = e.state.selection;
    const at = e.view.coordsAtPos(from);
    setLink({ left: at.left, top: at.bottom });
  }, []);

  const onCreate = (e: TiptapEditor) => {
    editorRef.current = e;
    setEditor(e);
    statsLoaded.current = true;
    if (stored)
      return restore(
        loadStats(stored.id) ?? { written: 0, elapsedMs: 0 },
        e.getText(),
      );
    const draft = loadDraft();
    if (!draft) return;
    e.commands.setContent(draft.content, { emitUpdate: false });
    restore(draft.stats, e.getText());
    // Read-only, the draft stays in the browser until they can save it.
    if (!e.isEmpty && !readOnly) saver.unsaved();
  };

  const deleteDocument = async () => {
    if (!doc) return;
    await remove(doc.id);
    saver.stop();
    clearStats(doc.id);
    router.replace("/app");
  };

  // Slid up by the header's height when only the toolbar stays.
  const chromeShift = headerShown
    ? ""
    : toolbarShown
      ? "-translate-y-14"
      : "-translate-y-full";

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <div
        ref={chrome}
        className={cn(
          "z-40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80",
          touch
            ? "sticky top-0"
            : cn(
                "fixed inset-x-0 top-0 transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none",
                chromeShift,
                !headerShown && !toolbarShown && "invisible",
              ),
        )}
      >
        {/* Hidden, it takes no pointer nor focus: holding never reveals. */}
        <header
          onPointerEnter={() => setOnTop((t) => ({ ...t, hover: true }))}
          onPointerLeave={() => setOnTop((t) => ({ ...t, hover: false }))}
          // Keyboard focus holds it; a clicked button keeping focus doesn't.
          onFocus={(e) =>
            setOnTop((t) => ({
              ...t,
              focus: e.target.matches(":focus-visible"),
            }))
          }
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              setOnTop((t) => ({ ...t, focus: false }));
          }}
          inert={!headerShown}
          className={cn(
            "transition-[visibility] duration-200 motion-reduce:transition-none",
            !headerShown && "invisible",
          )}
        >
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
            onMode={(next) => {
              setMode(next);
              // "Until typing" counts from now, not from the last keystroke.
              setTyped(false);
            }}
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
            readOnly={readOnly}
          />
        </header>
        {editor && (
          // Turned on or off, it slides out from under the header.
          <div
            inert={!toolbarShown}
            className={cn(
              "grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none",
              toolbarOn ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden border-t border-border/60">
              <FormattingToolbar
                editor={editor}
                onLink={() => openLink(editor)}
                pinnable={!touch}
                pinned={toolbarPinned}
                onPinnedChange={(p) => setToolbarPin(p ? "pinned" : "unpinned")}
                className="mx-auto h-12 max-w-[calc(68ch+4rem)] px-[clamp(8px,2vw,20px)]"
              />
            </div>
          </div>
        )}
      </div>

      <main
        className={cn(
          "wrap flex flex-1 flex-col",
          // Room for header and toolbar, so revealing them covers no text;
          // and for the bottom bar, so the last line can rise above it.
          touch ? "pt-8" : "pt-[clamp(112px,16vh,160px)]",
          "pb-32",
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
            placeholder={readOnly ? "The cursor is waiting" : undefined}
            editable={!readOnly}
            autofocus
            content={stored?.content}
            onCreate={onCreate}
            onUpdate={(e) => {
              record(e.getText());
              saver.changed();
            }}
            onLinkShortcut={openLink}
            // The caret never writes behind the bars.
            scrollMargin={{ top: touch ? 140 : 96, bottom: 160 }}
            codeBlock={CodeHighlight}
            className="flex-1 overflow-visible"
          />
          <p role="status" className="sr-only">
            {statusCopy[saver.phase]}
          </p>
        </div>
      </main>

      {/* Fixed at the bottom, same height however long the document grows. */}
      <div
        ref={panel}
        onPointerEnter={() => setOnBottom(true)}
        onPointerLeave={() => setOnBottom(false)}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30"
      >
        <div className="wrap">
          <div className="mx-auto max-w-[68ch]">
            {saver.problem && (
              <Toast
                tone={problemTone[saver.problem]}
                onDismiss={saver.dismiss}
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
                {saver.problem === "lapsed" && (
                  <SubscribeButton had={had} variant="outline" size="sm" />
                )}
                {saver.problem === "trialLimit" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // The save they asked for goes through once paying.
                      if (await startPaying()) save("manual");
                    }}
                  >
                    {billingCopy.startPaying}
                  </Button>
                )}
              </Toast>
            )}
            {readOnly && capped && (
              <Toast tone="warning">
                <span className="min-w-[24ch] flex-1">
                  {billingCopy.trialLimit} {billingCopy.trialLimitNext}
                </span>
                <Button
                  size="sm"
                  onClick={async () => {
                    // Writable once paying: the page comes back editable.
                    if (await startPaying()) router.refresh();
                  }}
                >
                  {billingCopy.startPaying}
                </Button>
              </Toast>
            )}
            {readOnly && !capped && (
              <Toast tone="neutral" role="status">
                <span className="min-w-[24ch] flex-1">
                  {billingCopy.readOnly[had ? "lapsed" : "never"]}
                </span>
                <SubscribeButton had={had} size="sm" />
              </Toast>
            )}
          </div>
        </div>
        <div
          inert={!countersShown}
          className={cn(
            "grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none",
            countersShown
              ? "pointer-events-auto grid-rows-[1fr]"
              : "invisible grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden bg-background">
            <div className="wrap">
              <div className="mx-auto flex h-16 max-w-[68ch] items-center gap-x-4 border-t sm:gap-x-7">
                <div className="flex items-baseline gap-x-4 sm:gap-x-7">
                  <Stat
                    value={stats.words}
                    label={stats.words === 1 ? "word" : "words"}
                    pop={pop}
                    digits={4}
                  />
                  <Stat value={wpm} label="per minute" pop={pop} />
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[0.95rem] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Reset stats
                  </button>
                </div>
                <label className="ml-auto flex cursor-pointer items-center gap-2.5 text-[0.95rem] text-muted-foreground">
                  <Switch
                    checked={pop}
                    disabled={reduced}
                    onCheckedChange={(on) => setFireworks(on ? "on" : "off")}
                  />
                  <span className="max-sm:sr-only">
                    {reduced ? "Fireworks (off: reduced motion)" : "Fireworks"}
                  </span>
                </label>
                {!touch && (
                  <Hint
                    side="top"
                    label={
                      countersPinned
                        ? "Unpin counters: they come with the pointer at the bottom"
                        : "Pin counters: keep them on screen"
                    }
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        countersPinned ? "Unpin counters" : "Pin counters"
                      }
                      onClick={() =>
                        setCountersPin(countersPinned ? "unpinned" : "pinned")
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {countersPinned ? <PinOffIcon /> : <PinIcon />}
                    </Button>
                  </Hint>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

/** A floating notice over the bottom of the page; problems can be closed. */
function Toast({
  tone,
  onDismiss,
  role = "alert",
  children,
}: {
  tone: "neutral" | "warning" | "destructive";
  onDismiss?: () => void;
  role?: "alert" | "status";
  children: React.ReactNode;
}) {
  return (
    <div
      role={role}
      className={cn(
        "pointer-events-auto mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-3 bg-background py-2.5 pl-4 text-[0.95rem] shadow-md",
        onDismiss ? "pr-2" : "pr-4",
        {
          neutral: "border-l-foreground",
          warning: "border-l-warning",
          destructive: "border-l-destructive",
        }[tone],
      )}
    >
      {children}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

const typingKeys = new Set(["Enter", "Backspace", "Delete"]);
