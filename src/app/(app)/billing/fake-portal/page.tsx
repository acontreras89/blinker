import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { FakeStripe } from "../fake-stripe";

export const instant = false;
export const metadata: Metadata = { title: "Billing portal (fake Stripe)" };

/** Stripe's Customer Portal, faked for e2e; the real one is tested by hand. */
export default async function FakePortal() {
  await requireUser("/billing/fake-portal");
  if (process.env.BILLING_GATEWAY !== "fake") notFound();
  return (
    <FakeStripe title="Billing portal">
      <p className="mb-8 text-[0.95rem] text-muted-foreground">
        Stripe&apos;s Customer Portal stands here: plan, card, invoices and
        cancelling.
      </p>
      <Link
        href="/account/billing"
        className={buttonVariants({ size: "xl", className: "w-full" })}
      >
        Back to Blinker
      </Link>
    </FakeStripe>
  );
}
