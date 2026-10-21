"use client";

import { cn } from "cn";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  manageBilling,
  startPayingAndWrite,
  subscribe,
} from "../billing/actions";
import { billingCopy, ctaLabel } from "../billing/copy";

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "children">;

/** The upgrade path's call to action: off to Checkout. */
export function SubscribeButton({ had, ...button }: Props & { had: boolean }) {
  return (
    <form action={subscribe}>
      <Submit {...button}>{ctaLabel(had)}</Submit>
    </form>
  );
}

/** Any label, same destination: "Start typing" without a subscription. */
export function CheckoutButton({
  children,
  ...button
}: Props & { children: string }) {
  return (
    <form action={subscribe}>
      <Submit {...button}>{children}</Submit>
    </form>
  );
}

/** Ends the trial, then a blank editor. */
export function StartPayingButton(button: Props) {
  return (
    <form action={startPayingAndWrite}>
      <Submit {...button}>{billingCopy.startPaying}</Submit>
    </form>
  );
}

/** Stripe's Customer Portal: plan, card, invoices, cancel. */
export function ManageBillingButton(button: Props) {
  return (
    <form action={manageBilling}>
      <Submit {...button}>{billingCopy.manageBilling}</Submit>
    </form>
  );
}

function Submit({ className, ...button }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-disabled={pending || undefined}
      // Once is enough: Stripe is on its way.
      onClick={(e) => pending && e.preventDefault()}
      className={cn("aria-disabled:opacity-60", className)}
      {...button}
    />
  );
}
