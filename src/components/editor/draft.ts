import type { JSONContent } from "@tiptap/react";
import type { StoredStats } from "./stats";

// The visitor's hero draft, kept in this browser until it becomes their first
// document (E5-01). The landing writes it; `/write` starts from it.
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
