const pattern = /^Untitled(?: \((\d+)\))?$/;

/**
 * The title for a new document: `Untitled`, then `Untitled (1)`, `(2)`…, the
 * lowest number free among the user's titles. Plain `Untitled` counts as 0.
 */
export function nextUntitled(titles: string[]): string {
  const taken = new Set(
    titles.flatMap((t) => {
      const match = pattern.exec(t);
      return match ? [Number(match[1] ?? 0)] : [];
    }),
  );
  let n = 0;
  while (taken.has(n)) n++;
  return n === 0 ? "Untitled" : `Untitled (${n})`;
}
