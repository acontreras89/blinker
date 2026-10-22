import type { JSONContent } from "@tiptap/react";
import type { StoredStats } from "./stats";

// The visitor's hero draft, kept in this browser until it becomes a document.
// The landing writes it; `/write` starts from it and clears it on first save.
const STORAGE_KEY = "blinker:hero";
export type Draft = { content: JSONContent; stats: StoredStats };

export function loadDraft(): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {}
}

/** The draft became a document: the next landing visit starts blank. */
export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// A document's writing stats, so a reload doesn't start the speed over.
const statsKey = (id: string) => `blinker:stats:${id}`;

export function loadStats(id: string): StoredStats | null {
  try {
    return JSON.parse(localStorage.getItem(statsKey(id)) ?? "null");
  } catch {
    return null;
  }
}

export function saveStats(id: string, stats: StoredStats) {
  try {
    localStorage.setItem(statsKey(id), JSON.stringify(stats));
  } catch {}
}

export function clearStats(id: string) {
  try {
    localStorage.removeItem(statsKey(id));
  } catch {}
}
