# 0009. Entitlements synced from Stripe, by webhook or on return

Status: Accepted · 2026-10-21 · Amends [0006](0006-own-billing-entitlements.md)

## Context

ADR-0006 wrote entitlements only from webhooks. A late webhook (or no
`stripe listen` running locally) would leave a paying user locked out with no
way forward. The brief asks what happens in that case.

## Decision

- One idempotent `syncSubscription(customerId)`: reads the subscription from
  the Stripe API and upserts the entitlement. Both paths call it.
- **Webhook**: signature verified, `event.id` stored, then sync.
- **Return from Checkout**: if our DB already grants access, done. Otherwise
  the server fetches the Checkout Session by `session_id`, checks it belongs to
  the logged-in user and is paid, then syncs. Still pending → "Confirming
  payment…" and re-check for a few seconds, then let the webhook finish it.
- Entitlements are written only by the server from data read from Stripe;
  never from the redirect itself.

## Consequences

- Event order stops mattering: each sync writes Stripe's current state.
- One extra Stripe call per event; fine at this scale.
- The `session_id` in the URL is a pointer, not proof.
