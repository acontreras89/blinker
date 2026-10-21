"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Content } from "@/server/documents/rules";
import { create, revisionOf, save as saveAction } from "../actions";

/** Quiet time after the last change before an autosave. */
export const AUTOSAVE_IDLE_MS = 1000;

export type Mode = "manual" | "auto";
/** What the status says: announced always, shown in the header. */
export type Phase = "idle" | "unsaved" | "saving" | "saved";
/** What must be seen: shown next to the counters until a save settles it. */
export type Problem =
  | "failed"
  | "warned"
  | "overwrote"
  | "changedElsewhere"
  | "tooLarge"
  | "missing";

export type Created = { id: string; title: string };

type Options = {
  /** The stored document; none for a blank `/write` until its first save. */
  stored?: { id: string; revision: number };
  editor: () => Editor | null;
  onCreated: (doc: Created) => void;
};

/**
 * Saves the editor's content (ADR-0008): manual saves always write, autosaves
 * after a pause never overwrite a newer version. One save runs at a time; a
 * save asked for meanwhile runs right after.
 */
export function useSaver({ stored, editor, onCreated }: Options) {
  const id = useRef(stored?.id ?? null);
  const revision = useRef(stored?.revision ?? 0);
  const version = useRef(0);
  const savedVersion = useRef(0);
  const running = useRef<Promise<void> | null>(null);
  const queued = useRef<Mode | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopped = useRef(false);
  const problemRef = useRef<Problem | null>(null);

  const [phase, setPhase] = useState<Phase>(stored ? "saved" : "idle");
  const [problem, setProblemState] = useState<Problem | null>(null);
  const setProblem = useCallback((p: Problem | null) => {
    problemRef.current = p;
    setProblemState(p);
  }, []);

  const dirty = () => version.current !== savedVersion.current;
  const onCreatedRef = useRef(onCreated);
  useEffect(() => {
    onCreatedRef.current = onCreated;
  });

  // One attempt; problems and phase follow its outcome.
  const once = useCallback(
    async (mode: Mode) => {
      const e = editor();
      if (!e || stopped.current) return;
      const behind = problemRef.current === "changedElsewhere";
      if (mode === "auto" && (behind || !dirty())) return;
      if (!id.current && e.isEmpty) return;
      if (mode === "manual" && !behind && !dirty()) {
        if (id.current) setPhase("saved");
        return;
      }

      const content = e.getJSON() as Content;
      const at = version.current;
      setPhase("saving");
      const outcome = await attempt(
        id.current,
        content,
        revision.current,
        mode,
      );
      if (stopped.current) return;
      if (outcome.status === "saved") {
        revision.current = outcome.revision;
        savedVersion.current = at;
        if (outcome.created) {
          id.current = outcome.created.id;
          onCreatedRef.current(outcome.created);
        }
        setProblem(outcome.overwrote ? "overwrote" : null);
        setPhase(dirty() ? "unsaved" : "saved");
        return;
      }
      setPhase("unsaved");
      if (outcome.status === "conflict") setProblem("changedElsewhere");
      else if (outcome.status === "too_large") setProblem("tooLarge");
      else if (outcome.status === "missing") setProblem("missing");
      else if (mode === "manual") setProblem("failed");
      else if (problemRef.current !== "failed") setProblem("warned");
    },
    [editor, setProblem],
  );

  const save = useCallback(
    (mode: Mode): Promise<void> => {
      clearTimeout(timer.current);
      if (running.current) {
        queued.current = queued.current === "manual" ? "manual" : mode;
        return running.current;
      }
      const run = (async () => {
        for (let next: Mode | null = mode; next;) {
          await once(next);
          next = queued.current;
          queued.current = null;
        }
        running.current = null;
      })();
      running.current = run;
      return run;
    },
    [once],
  );

  /** The content changed: unsaved until the next save, autosaved on a pause. */
  const changed = useCallback(() => {
    version.current++;
    setPhase("unsaved");
    if (problemRef.current === "overwrote") setProblem(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save("auto"), AUTOSAVE_IDLE_MS);
  }, [save, setProblem]);

  /** Content the user has not saved yet, loaded from elsewhere (the hero draft). */
  const unsaved = useCallback(() => {
    version.current++;
    setPhase("unsaved");
  }, []);

  /** Another tab saved since: say so, so this one can reload or overwrite. */
  const checkBehind = useCallback(async () => {
    if (!id.current || running.current || stopped.current) return;
    let latest: number | null;
    try {
      latest = await revisionOf(id.current);
    } catch {
      return;
    }
    if (running.current || stopped.current) return;
    if (latest === null) setProblem("missing");
    else if (latest > revision.current) setProblem("changedElsewhere");
  }, [setProblem]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (stopped.current || (!dirty() && !running.current)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") save("auto");
      else checkBehind();
    };
    const focus = () => checkBehind();
    addEventListener("beforeunload", beforeUnload);
    addEventListener("pagehide", visibility);
    addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      removeEventListener("beforeunload", beforeUnload);
      removeEventListener("pagehide", visibility);
      removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(timer.current);
    };
  }, [save, checkBehind]);

  return {
    phase,
    problem,
    save,
    changed,
    unsaved,
    /** Whether leaving now would lose something. */
    dirty: () => dirty() || !!running.current,
    /** Saves what is pending before leaving; true when nothing is lost. */
    flush: async () => {
      await save("auto");
      return !dirty();
    },
    /** The document is being deleted: nothing more is saved or reported. */
    stop: () => {
      stopped.current = true;
      clearTimeout(timer.current);
    },
  };
}

type Attempt =
  | {
      status: "saved";
      revision: number;
      overwrote: boolean;
      created?: Created;
    }
  | { status: "conflict" | "too_large" | "missing" | "failed" };

// A save that throws (connection lost, server down) is a failed save.
async function attempt(
  id: string | null,
  content: Content,
  revision: number,
  mode: Mode,
): Promise<Attempt> {
  try {
    if (!id) {
      const res = await create(content);
      if (res.status !== "saved") return res;
      const { id, title, revision } = res;
      return {
        status: "saved",
        revision,
        overwrote: false,
        created: { id, title },
      };
    }
    const res = await saveAction(id, content, revision, mode);
    if (res.status === "saved")
      return {
        status: "saved",
        revision: res.revision,
        overwrote: res.overwrote,
      };
    return { status: res.status };
  } catch {
    return { status: "failed" };
  }
}
