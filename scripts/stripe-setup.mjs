#!/usr/bin/env node
// Creates what the app needs in a Stripe test account: the monthly price
// (found by lookup key) and a Customer Portal configuration. Safe to re-run.
//
// Usage: pnpm stripe:setup   (reads STRIPE_SECRET_KEY from .env)

import Stripe from "stripe";
import { PRICE, STRIPE_METADATA } from "../src/server/billing/rules.ts";

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_")) {
  console.error("STRIPE_SECRET_KEY must be a test-mode key (sk_test_…).");
  process.exit(1);
}
const stripe = new Stripe(key);
const ours = (o) => o.metadata?.app === STRIPE_METADATA.app;

async function price() {
  const { data } = await stripe.prices.list({
    lookup_keys: [PRICE.lookupKey],
    active: true,
  });
  const current = data[0];
  if (
    current?.unit_amount === PRICE.amount &&
    current.currency === PRICE.currency &&
    current.recurring?.interval === PRICE.interval
  )
    return current;
  const products = await stripe.products.list({ active: true, limit: 100 });
  const product =
    products.data.find(ours) ??
    (await stripe.products.create({
      name: "Blinker Monthly",
      metadata: STRIPE_METADATA,
    }));
  // A changed amount gets a new price; the lookup key moves to it.
  return stripe.prices.create({
    product: product.id,
    unit_amount: PRICE.amount,
    currency: PRICE.currency,
    recurring: { interval: PRICE.interval },
    lookup_key: PRICE.lookupKey,
    transfer_lookup_key: true,
    metadata: STRIPE_METADATA,
  });
}

// Cancel at period end, card, invoices. No plan switching: there is one plan.
const features = {
  subscription_cancel: { enabled: true, mode: "at_period_end" },
  payment_method_update: { enabled: true },
  invoice_history: { enabled: true },
  customer_update: { enabled: false },
  subscription_update: { enabled: false },
};

async function portal() {
  const { data } = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  const current = data.find(ours);
  if (current)
    return stripe.billingPortal.configurations.update(current.id, {
      features,
    });
  return stripe.billingPortal.configurations.create({
    features,
    metadata: STRIPE_METADATA,
  });
}

const p = await price();
const c = await portal();
console.log(`Price   ${p.id} (${PRICE.lookupKey})`);
console.log(`Portal  ${c.id}`);
