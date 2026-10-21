import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { PRICE } from "@/server/billing/rules";
import { pay } from "./actions";
import { FakeStripe, PayButton } from "../../fake-stripe";

export const instant = false;
export const metadata: Metadata = { title: "Checkout (fake Stripe)" };

const price = `$${(PRICE.amount / 100).toFixed(2)}`;

/**
 * Stripe's hosted Checkout, faked for e2e (`BILLING_GATEWAY=fake`): pay or go
 * back. It exists only while the e2e routes do (`E2E_SEED=on`).
 */
export default async function FakeCheckout({
  params,
}: PageProps<"/billing/fake-checkout/[id]">) {
  const { id } = await params;
  await requireUser(`/billing/fake-checkout/${id}`);
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.api.e2e.billing.checkout[":id"].$get(
    { param: { id } },
    { headers: { cookie } },
  );
  if (!res.ok) notFound();
  const checkout = await res.json();
  if (!checkout.open) notFound();
  const { trialDays, cancelUrl } = checkout;

  return (
    <FakeStripe title="Subscribe to Blinker Monthly">
      <p className="text-[2.2rem] leading-tight font-extrabold tracking-[-0.03em]">
        {trialDays ? `${trialDays} days free` : price}
        <span className="block text-base font-medium tracking-normal text-muted-foreground">
          {trialDays ? `then ${price} per month` : "per month"}
        </span>
      </p>
      <dl className="mt-6 grid grid-cols-[1fr_auto] gap-y-2 border-t pt-4 text-[0.95rem]">
        <dt className="text-muted-foreground">Blinker Monthly</dt>
        <dd>{price}</dd>
        <dt className="font-semibold">Due today</dt>
        <dd className="font-semibold">{trialDays ? "$0.00" : price}</dd>
      </dl>
      <form action={pay.bind(null, id)} className="mt-8">
        <PayButton />
      </form>
      <a
        href={cancelUrl}
        className={buttonVariants({
          variant: "ghost",
          className: "mt-3 w-full text-muted-foreground",
        })}
      >
        Back
      </a>
    </FakeStripe>
  );
}
