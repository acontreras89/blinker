import { randomUUID } from "node:crypto";
import type {
  BillingGateway,
  Checkout,
  CheckoutInput,
  Subscription,
} from "./gateway";

// In-memory Stripe for Vitest and e2e. Its Checkout and Portal "hosted pages"
// are local routes (`/billing/fake-checkout/:id`, `/billing/fake-portal`).
// State sits on globalThis so every Next bundle in the process shares it.
type State = {
  checkouts: Map<string, { checkout: Checkout; input: CheckoutInput }>;
  subscriptions: Map<string, Subscription>;
};

const g = globalThis as { fakeBilling?: State };
const state = (g.fakeBilling ??= {
  checkouts: new Map(),
  subscriptions: new Map(),
});

const DAY = 24 * 60 * 60 * 1000;
const id = (prefix: string) => `${prefix}_fake_${randomUUID()}`;
const copy = (c: Checkout) => ({ ...c });

export const fakeGateway: BillingGateway = {
  async createCustomer() {
    return id("cus");
  },
  async createCheckout(input) {
    const checkoutId = id("cs");
    const checkout: Checkout = {
      id: checkoutId,
      customerId: input.customerId,
      url: new URL(`/billing/fake-checkout/${checkoutId}`, input.successUrl)
        .href,
      status: "open",
      paid: false,
    };
    state.checkouts.set(checkoutId, { checkout, input });
    return copy(checkout);
  },
  async getCheckout(id) {
    const c = state.checkouts.get(id)?.checkout;
    return c ? copy(c) : null;
  },
  async findOpenCheckout(customerId) {
    const c = [...state.checkouts.values()]
      .map((c) => c.checkout)
      .find((c) => c.customerId === customerId && c.status === "open");
    return c ? copy(c) : null;
  },
  async listSubscriptions(customerId) {
    return [...state.subscriptions.values()].filter(
      (s) => s.customerId === customerId,
    );
  },
  async endTrial(subscriptionId) {
    const now = Date.now();
    fakeBilling.update(subscriptionId, {
      status: "active",
      trialEnd: new Date(now),
      periodEnd: new Date(now + 30 * DAY),
    });
  },
  async createPortal(customerId, returnUrl) {
    const url = new URL("/billing/fake-portal", returnUrl);
    url.searchParams.set("customer", customerId);
    return url.href;
  },
};

/** What a test or the fake pages do in place of a human on Stripe. */
export const fakeBilling = {
  /** Pays (or starts the trial) and returns the `success_url`. */
  complete(checkoutId: string) {
    const c = state.checkouts.get(checkoutId);
    if (c?.checkout.status !== "open") throw new Error("No open checkout");
    const { checkout, input } = c;
    const now = Date.now();
    const trialEnd = input.trialDays
      ? new Date(now + input.trialDays * DAY)
      : null;
    const s: Subscription = {
      id: id("sub"),
      customerId: input.customerId,
      status: trialEnd ? "trialing" : "active",
      trialEnd,
      periodEnd: trialEnd ?? new Date(now + 30 * DAY),
      cancelAt: null,
    };
    state.subscriptions.set(s.id, s);
    Object.assign(checkout, { status: "complete", paid: true });
    const successUrl = input.successUrl.replace(
      "{CHECKOUT_SESSION_ID}",
      checkout.id,
    );
    return { subscription: s, successUrl };
  },
  expire(checkoutId: string) {
    const c = state.checkouts.get(checkoutId)?.checkout;
    if (c) c.status = "expired";
  },
  update(subscriptionId: string, patch: Partial<Subscription>) {
    const s = state.subscriptions.get(subscriptionId);
    if (!s) throw new Error("No subscription");
    Object.assign(s, patch);
    return s;
  },
  subscriptions(customerId: string) {
    return fakeGateway.listSubscriptions(customerId);
  },
};
