// What we sell, shared with the landing. `pnpm stripe:setup` creates the
// Stripe price from PRICE; Checkout finds it by lookup key.
export const PRICE = {
  amount: 800,
  currency: "usd",
  interval: "month",
  lookupKey: "monthly",
} as const;

export const TRIAL_DAYS = 3;
export const TRIAL_DOCUMENT_LIMIT = 1;

/** Tags our objects in a Stripe account (product, price, Portal config). */
export const STRIPE_METADATA = { app: "blinker" } as const;
