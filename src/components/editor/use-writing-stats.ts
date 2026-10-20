import { useCallback, useState } from "react";
import { useClock } from "@/hooks/use-clock";
import {
  EMPTY_STATS,
  recordText,
  resetStats,
  restoreStats,
  wordsPerMinute,
  type StoredStats,
} from "./stats";

export function useWritingStats() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const clock = useClock(1000);
  return {
    stats,
    clock,
    wpm: wordsPerMinute(stats, clock.now),
    record: useCallback(
      (text: string) => setStats((s) => recordText(s, text, Date.now())),
      [],
    ),
    reset: useCallback(() => setStats(resetStats), []),
    restore: useCallback(
      (stored: StoredStats, text: string) =>
        setStats(restoreStats(stored, text, Date.now())),
      [],
    ),
  };
}
