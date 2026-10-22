import { describe, expect, it } from "vitest";
import {
  EMPTY_STATS,
  countWords,
  recordText,
  resetStats,
  restoreStats,
  storeStats,
  wordsPerMinute,
} from "./stats";

const MIN = 60_000;

describe("writing stats", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  the cursor\n is   judging ")).toBe(4);
  });

  it("starts the clock at the first keystroke", () => {
    const s = recordText(EMPTY_STATS, "a", 1000);
    expect(s.since).toBe(1000);
    expect(recordText(s, "a b", 5000).since).toBe(1000);
  });

  it("credits written words and keeps them when text is deleted", () => {
    let s = recordText(EMPTY_STATS, "one two three", 0);
    s = recordText(s, "", 1000);
    s = recordText(s, "four", 2000);
    expect(s.words).toBe(1);
    expect(s.written).toBe(4);
  });

  it("measures speed over written words, with a 10s floor", () => {
    const s = recordText(EMPTY_STATS, "one two three", 0);
    expect(wordsPerMinute(s, 1000)).toBe(18);
    expect(wordsPerMinute(recordText(s, "", 1000), 1000)).toBe(18);
    expect(wordsPerMinute(s, MIN)).toBe(3);
  });

  it("resets speed but keeps the document length", () => {
    const s = resetStats(recordText(EMPTY_STATS, "one two", 0));
    expect(s).toEqual({ ...EMPTY_STATS, words: 2 });
    expect(wordsPerMinute(s, MIN)).toBe(0);
  });

  it("survives a round trip through storage, resuming the clock", () => {
    const s = recordText(EMPTY_STATS, "one two", 0);
    const stored = storeStats(s, MIN);
    expect(stored).toEqual({ written: 2, elapsedMs: MIN });
    const back = restoreStats(stored, "one two", 10 * MIN);
    expect(back).toEqual({
      words: 2,
      written: 2,
      elapsedMs: MIN,
      since: 10 * MIN,
    });
    expect(wordsPerMinute(back, 11 * MIN)).toBe(1);
  });

  it("does not run the clock for a restored empty session", () => {
    expect(restoreStats({ written: 0, elapsedMs: 0 }, "", 5).since).toBeNull();
  });
});
