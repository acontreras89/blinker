"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Writing } from "@/lib/billing";
import { billingCopy } from "../billing/copy";
import { CheckoutButton, StartPayingButton } from "./subscribe-button";

type StartTypingProps = {
  mode: Writing;
  size: "xl" | "2xl";
};

/** The dashboard's primary CTA; always "Start typing", wherever it leads. */
export function StartTyping({ mode, size }: StartTypingProps) {
  const [capped, setCapped] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  if (mode === "write")
    return (
      <Link href="/write" className={buttonVariants({ size })}>
        Start typing
      </Link>
    );
  if (mode === "subscribe")
    return <CheckoutButton size={size}>Start typing</CheckoutButton>;
  return (
    <>
      <Button
        ref={button}
        size={size}
        onClick={() => {
          setCapped(true);
          // The "can't do that" shake; the notice says why.
          if (!reduced)
            button.current?.animate(
              [0, -6, 6, -4, 4, 0].map((x) => ({
                transform: `translateX(${x}px)`,
              })),
              { duration: 360, easing: "ease-in-out" },
            );
        }}
      >
        Start typing
      </Button>
      {capped && (
        <div
          role="alert"
          className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-[min(34rem,calc(100vw-2rem))] flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-3 border-l-warning bg-background py-2.5 pr-2 pl-4 text-[0.95rem] shadow-md"
        >
          <span className="flex-1">
            {billingCopy.trialLimit} {billingCopy.trialLimitNext}
          </span>
          <StartPayingButton variant="outline" size="sm" />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={() => setCapped(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon />
          </Button>
        </div>
      )}
    </>
  );
}
