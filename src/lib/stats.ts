// Writing stats. `words` is the document length; `written` only grows, so
// deleting never lowers the speed. Keeping both lets either label flip later.
export type WritingStats = {
  words: number;
  written: number;
  elapsedMs: number;
  /** Start of the running clock; null while stopped. */
  since: number | null;
};

/** What survives a reload; `words` is recounted from the content. */
export type StoredStats = Pick<WritingStats, "written" | "elapsedMs">;

const MIN_ELAPSED_MS = 10_000; // avoids absurd speeds in the first seconds

export const EMPTY_STATS: WritingStats = {
  words: 0,
  written: 0,
  elapsedMs: 0,
  since: null,
};

export function countWords(text: string): number {
  return text.match(/\S+/g)?.length ?? 0;
}

/** The text changed: recount, credit new words, start the clock if stopped. */
export function recordText(
  stats: WritingStats,
  text: string,
  now: number,
): WritingStats {
  const words = countWords(text);
  return {
    words,
    written: stats.written + Math.max(0, words - stats.words),
    elapsedMs: stats.elapsedMs,
    since: stats.since ?? now,
  };
}

export function elapsed(stats: WritingStats, now: number): number {
  return stats.elapsedMs + (stats.since === null ? 0 : now - stats.since);
}

export function wordsPerMinute(stats: WritingStats, now: number): number {
  if (stats.written === 0) return 0;
  const minutes = Math.max(elapsed(stats, now), MIN_ELAPSED_MS) / 60_000;
  return Math.round(stats.written / minutes);
}

/** Speed starts over; the document keeps its length. */
export function resetStats(stats: WritingStats): WritingStats {
  return { ...EMPTY_STATS, words: stats.words };
}

export function storeStats(stats: WritingStats, now: number): StoredStats {
  return { written: stats.written, elapsedMs: elapsed(stats, now) };
}

/** Back from storage: the clock resumes if there was anything written. */
export function restoreStats(
  stored: StoredStats,
  text: string,
  now: number,
): WritingStats {
  return {
    words: countWords(text),
    written: stored.written,
    elapsedMs: stored.elapsedMs,
    since: stored.written > 0 ? now : null,
  };
}
