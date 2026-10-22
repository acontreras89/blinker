// Dates on the dashboard: relative on screen, exact on request.
const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const time = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });

const units = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
] as const;

/** "2 hours ago", "yesterday", "just now": whole units, rounded down. */
export function timeAgo(date: Date, now: number): string {
  const seconds = Math.max(0, (now - date.getTime()) / 1000);
  for (const [unit, size] of units)
    if (seconds >= size)
      return relative.format(-Math.floor(seconds / size), unit);
  return "just now";
}

/** "18 Oct 2026 · 3:04 PM", in the reader's time zone; no commas. */
export const exactDate = (date: Date) =>
  `${day.format(date)} · ${time.format(date)}`;
