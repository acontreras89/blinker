import Stripe from "stripe";
import type { BillingGateway, Checkout, Subscription } from "./gateway";
import { PRICE, STRIPE_METADATA } from "./rules";

/** Test mode only: a live or missing key never reaches Stripe. */
export function assertTestKey(key = process.env.STRIPE_SECRET_KEY) {
  if (!key?.startsWith("sk_test_"))
    throw new Error("STRIPE_SECRET_KEY must be a test-mode key (sk_test_…).");
  return key;
}

/** Boot check: the server refuses to start without a test key (E6). */
export function assertBillingConfig() {
  if (process.env.BILLING_GATEWAY === "fake") return;
  assertTestKey();
  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"))
    throw new Error("STRIPE_WEBHOOK_SECRET is not set (whsec_…).");
}

const idOf = (x: string | { id: string } | null) =>
  typeof x === "string" ? x : (x?.id ?? null);

const date = (s: number | null) => (s === null ? null : new Date(s * 1000));

function toCheckout(s: Stripe.Checkout.Session): Checkout {
  return {
    id: s.id,
    customerId: idOf(s.customer),
    url: s.url,
    status:
      s.status === "complete"
        ? "complete"
        : s.status === "expired"
          ? "expired"
          : "open",
    paid: s.payment_status !== "unpaid",
  };
}

// Period end lives on the item in current API versions (stripe-notes).
function toSubscription(s: Stripe.Subscription): Subscription {
  return {
    id: s.id,
    customerId: idOf(s.customer)!,
    status: s.status,
    trialEnd: date(s.trial_end),
    periodEnd: date(
      Math.max(...s.items.data.map((i) => i.current_period_end)),
    )!,
    cancelAt: date(
      s.cancel_at ??
        (s.cancel_at_period_end ? s.items.data[0].current_period_end : null),
    ),
  };
}

export function stripeGateway(): BillingGateway {
  const stripe = new Stripe(assertTestKey());
  let priceId: Promise<string> | undefined;
  let portalId: Promise<string> | undefined;

  // Created by `pnpm stripe:setup`; looked up once per process.
  const price = () =>
    (priceId ??= stripe.prices
      .list({ lookup_keys: [PRICE.lookupKey], active: true })
      .then(({ data }) => {
        if (!data[0]) throw new Error("No price: run `pnpm stripe:setup`.");
        return data[0].id;
      }));
  const portal = () =>
    (portalId ??= stripe.billingPortal.configurations
      .list({ active: true, limit: 100 })
      .then(({ data }) => {
        const config = data.find(
          (c) => c.metadata?.app === STRIPE_METADATA.app,
        );
        if (!config) throw new Error("No Portal: run `pnpm stripe:setup`.");
        return config.id;
      }));

  return {
    async createCustomer({ id, email, name }) {
      const c = await stripe.customers.create({
        email,
        name,
        metadata: { userId: id },
      });
      return c.id;
    },
    async createCheckout({ customerId, trialDays, successUrl, cancelUrl }) {
      const s = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: await price(), quantity: 1 }],
        allowed_payment_method_types: ["card"],
        subscription_data: trialDays
          ? { trial_period_days: trialDays }
          : undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return toCheckout(s);
    },
    async getCheckout(id) {
      try {
        return toCheckout(await stripe.checkout.sessions.retrieve(id));
      } catch (e) {
        if (e instanceof Stripe.errors.StripeInvalidRequestError) return null;
        throw e;
      }
    },
    async findOpenCheckout(customerId) {
      const { data } = await stripe.checkout.sessions.list({
        customer: customerId,
        status: "open",
        limit: 1,
      });
      return data[0] ? toCheckout(data[0]) : null;
    },
    async listSubscriptions(customerId) {
      const { data } = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      return data.map(toSubscription);
    },
    async endTrial(subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, { trial_end: "now" });
    },
    async createPortal(customerId, returnUrl) {
      const s = await stripe.billingPortal.sessions.create({
        customer: customerId,
        configuration: await portal(),
        return_url: returnUrl,
      });
      return s.url;
    },
  };
}
