import { eq } from "drizzle-orm";
import { db } from "../db";
import { entitlements, stripeEvents, users } from "../db/schema";
import { getAccess, trialEligible } from "./access";
import { fakeGateway } from "./fake";
import type { BillingGateway } from "./gateway";
import { TRIAL_DAYS } from "./rules";
import { stripeGateway } from "./stripe";

let current: BillingGateway | undefined;
export const gateway = () =>
  (current ??=
    process.env.BILLING_GATEWAY === "fake" ? fakeGateway : stripeGateway());

const appUrl = (path: string) =>
  new URL(path, process.env.BETTER_AUTH_URL ?? "http://localhost:3000").href;

const account = {
  id: users.id,
  email: users.email,
  name: users.name,
  customerId: users.stripeCustomerId,
};
const userById = (id: string) =>
  db.select(account).from(users).where(eq(users.id, id)).get();
const userByCustomer = (customerId: string) =>
  db
    .select(account)
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .get();

export const alreadyProcessed = (eventId: string) =>
  !!db
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, eventId))
    .get();

/**
 * Writes Stripe's current subscriptions for a customer (ADR-0009). Webhook and
 * Checkout return both land here, so event order doesn't matter. With an
 * event, its id is stored in the same transaction: a replay writes nothing.
 */
export async function syncSubscription(
  customerId: string,
  event?: { id: string; type: string },
) {
  const user = userByCustomer(customerId);
  const subscriptions = user
    ? await gateway().listSubscriptions(customerId)
    : [];
  return db.transaction((tx) => {
    if (event) {
      const { changes } = tx
        .insert(stripeEvents)
        .values(event)
        .onConflictDoNothing()
        .run();
      if (!changes) return "replay" as const;
    }
    for (const { id, status, trialEnd, periodEnd, cancelAt } of subscriptions) {
      const fields = { status, trialEnd, periodEnd, cancelAt };
      tx.insert(entitlements)
        .values({ id, userId: user!.id, kind: "subscription", ...fields })
        .onConflictDoUpdate({
          target: entitlements.id,
          set: { ...fields, updatedAt: new Date() },
        })
        .run();
    }
    return "synced" as const;
  });
}

/** Where "Subscribe" sends the user: Checkout, or billing if already in. */
export async function startCheckout(userId: string) {
  if (getAccess(userId)) return { redirect: "/account/billing" as const };
  const user = userById(userId)!;
  let customerId = user.customerId;
  if (!customerId) {
    customerId = await gateway().createCustomer(user);
    db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .run();
  }
  const open = await gateway().findOpenCheckout(customerId);
  const checkout =
    open ??
    (await gateway().createCheckout({
      customerId,
      trialDays: trialEligible(userId) ? TRIAL_DAYS : null,
      successUrl: appUrl("/billing/return?session_id={CHECKOUT_SESSION_ID}"),
      cancelUrl: appUrl("/app"),
    }));
  return { url: checkout.url! };
}

/**
 * Back from Checkout. Our DB first; otherwise the session, if it is this
 * user's and settled, is synced from the API. The redirect alone is no proof.
 */
export async function confirmReturn(userId: string, sessionId: string) {
  if (getAccess(userId)) return "ready" as const;
  const { customerId } = userById(userId)!;
  try {
    const checkout = await gateway().getCheckout(sessionId);
    if (!checkout || !customerId || checkout.customerId !== customerId)
      return "invalid" as const;
    if (checkout.status !== "complete" || !checkout.paid)
      return "pending" as const;
    await syncSubscription(customerId);
  } catch {
    // Stripe unreachable: the page retries, then the webhook finishes it.
    return "pending" as const;
  }
  return getAccess(userId) ? ("ready" as const) : ("pending" as const);
}

/** "Start paying now": the trial ends and the first payment is taken. */
export async function endTrial(userId: string) {
  const access = getAccess(userId);
  const { customerId } = userById(userId)!;
  if (access?.entitlement.status !== "trialing" || !customerId) return false;
  await gateway().endTrial(access.entitlement.id);
  await syncSubscription(customerId);
  return true;
}

export async function portalUrl(userId: string) {
  const { customerId } = userById(userId)!;
  if (!customerId) return null;
  return gateway().createPortal(customerId, appUrl("/account/billing"));
}
