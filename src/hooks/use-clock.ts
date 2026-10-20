import { useEffect, useState } from "react";

/**
 * Wall clock from mount on, refreshed every `intervalMs`. Zeros until the
 * first tick, so prerendering never reads the time.
 */
export function useClock(intervalMs: number): { start: number; now: number } {
  const [clock, setClock] = useState({ start: 0, now: 0 });
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(
      () => setClock({ start, now: Date.now() }),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [intervalMs]);
  return clock;
}
