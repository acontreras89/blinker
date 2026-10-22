"use client";

import type { Editor as TiptapEditor } from "@tiptap/react";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { loadDraft, saveDraft } from "@/lib/draft";
import { Editor } from "@/components/editor/editor";
import { Stat } from "@/components/editor/stat";
import { storeStats } from "@/lib/stats";
import { useWritingStats } from "@/hooks/use-writing-stats";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const minutes = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function Hero({ finePrint }: { finePrint: string }) {
  const { stats, clock, wpm, record, reset, restore } = useWritingStats();
  const editor = useRef<TiptapEditor | null>(null);
  const [lastInputAt, setLastInputAt] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const [fireworks, setFireworks] = useState(true);
  const pop = fireworks && !reduced;

  const persist = useEffectEvent(() => {
    if (editor.current)
      saveDraft({
        content: editor.current.getJSON(),
        stats: storeStats(stats, Date.now()),
      });
  });
  useEffect(() => persist(), [stats]);
  useEffect(() => {
    addEventListener("pagehide", persist);
    return () => removeEventListener("pagehide", persist);
  }, []);

  const onCreate = (e: TiptapEditor) => {
    const draft = loadDraft();
    if (draft) {
      e.commands.setContent(draft.content, { emitUpdate: false });
      restore(draft.stats, e.getText());
    }
    editor.current = e;
  };
  const onUpdate = (e: TiptapEditor) => {
    record(e.getText());
    setLastInputAt(Date.now());
  };

  let nag: React.ReactNode = "Keep going, it's working.";
  if (stats.since === null)
    nag = (
      <>
        You&apos;ve been here <b>{minutes(clock.now - clock.start)}</b>.
        Somebody else already wrote a paragraph.
      </>
    );
  else if (stats.words === 0)
    nag = "Back to blank. The page missed being empty; the cursor didn't.";
  else if (lastInputAt !== null && clock.now - lastInputAt > 5000)
    nag = (
      <>
        <b>{stats.words}</b> {stats.words === 1 ? "word" : "words"}, then
        nothing for <b>{minutes(clock.now - lastInputAt)}</b>. The cursor
        noticed.
      </>
    );

  return (
    // One screen on desktop, the editor scrolling inside; on short phones it
    // grows instead of spilling over the next section.
    <section className="wrap flex min-h-[calc(100svh-5rem)] flex-col md:h-[calc(100svh-5rem)] md:min-h-[34rem] pt-[clamp(24px,6vh,72px)] pb-[clamp(24px,5vh,56px)]">
      <h1 className="sr-only">
        Blinker: a text editor that wants you to start typing
      </h1>
      <p
        aria-live="polite"
        className="mb-[clamp(16px,3vh,28px)] min-h-[1.6em] shrink-0 text-[clamp(1rem,1.5vw,1.15rem)] text-muted-foreground [&_b]:text-foreground [&_b]:tabular-nums"
      >
        {nag}
      </p>
      <Editor
        label="Try it: type anything"
        size="display"
        onCreate={onCreate}
        onUpdate={onUpdate}
        className="min-h-[1lh] shrink"
      />
      <div className="mt-[clamp(20px,4vh,36px)] flex shrink-0 flex-wrap items-center gap-x-7 gap-y-3 border-t pt-4">
        <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3">
          <Stat
            value={stats.words}
            label={stats.words === 1 ? "word" : "words"}
            pop={pop}
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
        <label className="flex cursor-pointer items-center gap-2.5 text-[0.95rem] text-muted-foreground sm:ml-auto">
          <Switch
            checked={pop}
            disabled={reduced}
            onCheckedChange={setFireworks}
          />
          {reduced ? "Fireworks (off: reduced motion)" : "Fireworks"}
        </label>
      </div>
      <div className="mt-auto grid shrink-0 items-end gap-x-12 gap-y-7 pt-[clamp(24px,5vh,56px)] md:grid-cols-[minmax(0,1fr)_auto]">
        <p className="max-w-[44ch] text-[clamp(1.15rem,1.6vw,1.3rem)] text-muted-foreground">
          Blinker is a rich text editor for people who should be writing right
          now. A blank page, no toolbar, autosave, and a cursor that won&apos;t
          stop staring at you.
        </p>
        <div className="flex flex-col items-start gap-2.5">
          <Link href="/signup" className={buttonVariants({ size: "2xl" })}>
            Start typing
          </Link>
          <small className="max-w-[30ch] text-[0.9rem] text-muted-foreground">
            {finePrint}
          </small>
        </div>
      </div>
    </section>
  );
}
