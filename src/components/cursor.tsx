import { cn } from "cn";

/** The brand mark: a blinking primary bar. */
export function Cursor({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-[0.05em] inline-block h-[0.85em] w-[0.1em] min-w-[3px] animate-blink bg-primary align-[-0.08em]",
        className,
      )}
    />
  );
}
