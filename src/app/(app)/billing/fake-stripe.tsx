"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * The frame of the fake Stripe pages (e2e only): neutral, plainly a stand-in,
 * so nobody mistakes it for the real thing.
 */
export function FakeStripe({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border bg-background p-7 shadow-sm">
        <p className="mb-5 inline-flex rounded-md border border-warning/40 px-2 py-0.5 text-[0.8rem] font-semibold text-warning">
          Fake Stripe · test mode
        </p>
        <h1 className="mb-2 text-[1.15rem] font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function PayButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="xl"
      aria-disabled={pending || undefined}
      onClick={(e) => pending && e.preventDefault()}
      className="w-full aria-disabled:opacity-60"
    >
      Subscribe
    </Button>
  );
}
