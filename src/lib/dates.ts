// Dates on the dashboard: relative on screen, exact on request.
const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
const exact = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

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

/** "Oct 18, 2026, 3:04 PM", in the reader's time zone. */
export const exactDate = (date: Date) => exact.format(date);
