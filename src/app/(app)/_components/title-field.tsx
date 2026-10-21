"use client";

import { cn } from "cn";
import { useId, useRef, useState } from "react";
import { TITLE_MAX, title as titleRule } from "@/server/documents/rules";
import { rename, type RenameOutcome } from "../actions";

export const titleCopy = {
  tooLong: `Too long. ${TITLE_MAX} characters, tops. It's a title, not a chapter.`,
  failed: "Not renamed. The server blinked first. Try again.",
  lapsed: "Not renamed: your subscription has ended.",
};

type TitleFieldProps = {
  id: string;
  title: string;
  /** Closes the field with the title to show: the new one, or the old one. */
  onDone: (title: string) => void;
  className?: string;
};

/**
 * Renames a document in place, in the list and in the editor. Enter or blur
 * confirms, Escape cancels; an empty title keeps the old one. The server
 * trims and checks the length again.
 */
export function TitleField({ id, title, onDone, className }: TitleFieldProps) {
  const errorId = useId();
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const done = useRef(false);

  const finish = (next: string) => {
    done.current = true;
    onDone(next);
  };

  const confirm = async () => {
    if (busy.current || done.current) return;
    const checked = titleRule.safeParse(value);
    if (!checked.success) return setError(titleCopy.tooLong);
    if (!checked.data || checked.data === title) return finish(title);
    busy.current = true;
    let outcome: RenameOutcome | undefined;
    try {
      outcome = await rename(id, checked.data);
    } catch {}
    busy.current = false;
    if (outcome?.status === "renamed") return finish(outcome.title);
    if (outcome?.status === "missing") return finish(title);
    const status = outcome?.status;
    setError(
      status === "too_long"
        ? titleCopy.tooLong
        : status === "no_access"
          ? titleCopy.lapsed
          : titleCopy.failed,
    );
  };

  return (
    <span className={cn("relative block", className)}>
      <input
        aria-label="Title"
        value={value}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          setValue(e.target.value);
          if (error && titleRule.safeParse(e.target.value).success)
            setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirm();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            finish(title);
          }
        }}
        onBlur={confirm}
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? errorId : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full min-w-0 rounded-md border border-input bg-background px-2 py-0 font-[inherit] leading-[inherit] text-[length:inherit] text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
      />
      {error && (
        <span
          id={errorId}
          className="absolute top-full left-0 z-10 mt-1.5 w-max max-w-[min(36ch,80vw)] rounded-md border border-l-3 border-l-destructive bg-popover px-3 py-1.5 text-[0.9rem] font-normal tracking-normal text-destructive shadow-md"
        >
          {error}
        </span>
      )}
    </span>
  );
}
