"use client";

import { cn } from "cn";

/**
 * The brand mark: a blinking primary bar. Every cursor on the page blinks in
 * step: each animation starts at the document's time origin, not on mount.
 */
export function Cursor({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      ref={(el) => {
        el?.getAnimations().forEach((a) => (a.startTime = 0));
      }}
      className={cn(
        "ml-[0.05em] inline-block h-[0.85em] w-[0.1em] min-w-[3px] animate-blink bg-primary align-[-0.08em]",
        className,
      )}
    />
  );
}
