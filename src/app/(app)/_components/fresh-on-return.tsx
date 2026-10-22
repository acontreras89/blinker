"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { Cursor } from "@/components/cursor";

/**
 * Next keeps left pages alive, hidden (Activity), and shows them again as they
 * were on back/forward or a push to the same route. An editor can't come back
 * like that: its revision, access and document id may be stale, and Tiptap's
 * view is gone. So it unmounts when hidden and mounts again only once the
 * server has sent fresh props.
 */
export function FreshOnReturn({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(true);
  const [, startRefresh] = useTransition();
  const left = useRef(false);

  useLayoutEffect(() => {
    // Both land together, once the server has answered.
    if (left.current)
      startRefresh(() => {
        router.refresh();
        setReady(true);
      });
    return () => {
      left.current = true;
      setReady(false);
    };
  }, [router]);

  return ready ? children : <Opening />;
}

/** The page while its document is on its way: just the cursor. */
export function Opening({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "wrap flex flex-1 flex-col pt-[clamp(112px,16vh,160px)] text-lg",
        className,
      )}
    >
      <p className="mx-auto w-full max-w-[68ch]">
        <span className="sr-only">Opening the document</span>
        <Cursor />
      </p>
    </div>
  );
}
