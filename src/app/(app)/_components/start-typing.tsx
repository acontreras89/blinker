"use client";

import { cn } from "cn";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { billingCopy } from "../billing/copy";
import { CheckoutButton, StartPayingButton } from "./subscribe-button";

/** A blank editor, the trial's cap (said up front), or Checkout. */
export type Writing = "write" | "capped" | "subscribe";

type StartTypingProps = {
  mode: Writing;
  size: "xl" | "2xl";
  /** Where the trial's notice lines up under the button. */
  align?: "start" | "end";
};

/** The dashboard's primary CTA; always "Start typing", wherever it leads. */
export function StartTyping({ mode, size, align = "end" }: StartTypingProps) {
  const [capped, setCapped] = useState(false);
  if (mode === "write")
    return (
      <Link href="/write" className={buttonVariants({ size })}>
        Start typing
      </Link>
    );
  if (mode === "subscribe")
    return <CheckoutButton size={size}>Start typing</CheckoutButton>;
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "end" ? "items-start sm:items-end" : "items-start",
      )}
    >
      <Button size={size} onClick={() => setCapped(true)}>
        Start typing
      </Button>
      {capped && (
        <div
          role="alert"
          className="flex max-w-md flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-3 border-l-warning px-4 py-2.5 text-[0.95rem]"
        >
          <span className="flex-1">
            {billingCopy.trialLimit} {billingCopy.trialLimitNext}
          </span>
          <StartPayingButton variant="outline" size="sm" />
        </div>
      )}
    </div>
  );
}
