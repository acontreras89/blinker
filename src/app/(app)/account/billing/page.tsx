import type { Metadata } from "next";
import { Cursor } from "@/components/cursor";
import { getBilling, type Plan } from "@/lib/billing";
import { requireUser } from "@/lib/session";
import { PRICE } from "@/server/billing/rules";
import { AppHeader } from "../../_components/app-header";
import {
  ManageBillingButton,
  SubscribeButton,
} from "../../_components/subscribe-button";
import { billingCopy, day } from "../../billing/copy";

export const instant = false;
export const metadata: Metadata = { title: "Billing" };

const copy = {
  trialEnds: (d: string) => `Your trial ends on ${d}.`,
  renews: (d: string) => `Renews on ${d}.`,
  accessUntil: (d: string) => `Canceled. You can keep writing until ${d}.`,
  noSubscription: "You have no subscription. The cursor is waiting.",
  portal: "Card, invoices and cancelling live on Stripe.",
};

/** Where the subscription stands, most urgent first. */
function standing(plan: Plan) {
  if (plan.status === "past_due") return billingCopy.pastDue;
  if (plan.cancelAt) return copy.accessUntil(day(plan.cancelAt));
  if (plan.status === "trialing" && plan.trialEnd)
    return copy.trialEnds(day(plan.trialEnd));
  return copy.renews(day(plan.periodEnd));
}

export default async function Billing() {
  await requireUser("/account/billing");
  const { access, had } = await getBilling();
  return (
    <>
      <AppHeader />
      <main className="wrap flex flex-1 flex-col pt-[clamp(24px,6vh,72px)] pb-[clamp(64px,14vh,160px)]">
        <h1 className="mb-8 text-section font-extrabold tracking-[-0.03em]">
          Billing
          <Cursor />
        </h1>
        <section className="max-w-xl border-t pt-6">
          {access ? (
            <>
              <p className="font-semibold text-muted-foreground">
                Monthly · ${PRICE.amount / 100} a month
                {access.status === "trialing" && " · trial"}
              </p>
              <p className="mt-2 text-[1.3rem]">{standing(access)}</p>
            </>
          ) : (
            <p className="text-[1.3rem]">{copy.noSubscription}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {!access && <SubscribeButton had={had} size="xl" />}
            {(access || had) && (
              <ManageBillingButton
                variant={access ? "default" : "outline"}
                size="xl"
              />
            )}
          </div>
          {(access || had) && (
            <p className="mt-4 text-[0.95rem] text-muted-foreground">
              {copy.portal}
            </p>
          )}
        </section>
      </main>
    </>
  );
}
