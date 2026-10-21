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
