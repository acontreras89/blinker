# Stripe notes

Running notes on the billing integration for the README and write-up (E7).
Security-relevant ones live in [security notes](security-notes.md); decisions
in [ADR-0006](adr/0006-own-billing-entitlements.md) and
[ADR-0009](adr/0009-sync-entitlements-from-stripe.md).

- **Registered but never paid is a normal state.** Signup opens Checkout, but
  the user can cancel, go back or close the tab. They land as a non-subscriber
  and the upgrade path takes over.
- **Price is hardcoded on the landing.** `stripe:setup` creates the Stripe
  price from the same constant, so they agree. Next: read the price from
  Stripe, with the constant as fallback.
- **Processed events live in the main DB.** Keeping them next to the
  entitlements lets the dedup insert and the write share one transaction,
  which also holds on Postgres. At high volume: prune old rows or move dedup
  to a TTL store (Redis).
- **Events we listen to:** `checkout.session.completed`,
  `customer.subscription.created|updated|deleted`. Each one just triggers a
  sync, so status changes (trial end, renewal, `past_due`, Portal cancel) all
  arrive as `subscription.updated`. Ignored on purpose: `invoice.*` and
  `payment_intent.*` / `charge.*` (the subscription status already reflects
  them), `charge.refunded` / `charge.dispute.*` (refunds and disputes are out
  of scope: a limitation), `customer.subscription.trial_will_end` (no emails),
  `paused` / `resumed` (pausing not enabled), `product.*` / `price.*` (static).
- **Card only in Checkout.** Async methods (SEPA, bank debits) confirm days
  later and add pending states; left out, a limitation. API `2026-09-30`
  dropped `payment_method_types` on Checkout: it is
  `allowed_payment_method_types` now.
- **Stripe has its own "Entitlements" API** (Features). We don't use it; our
  entitlements are our table.
- **Period end is on the subscription item** in current API versions, not on
  the subscription.
- **A cancellation can arrive as `cancel_at` or `cancel_at_period_end`.** We
  store one `cancelAt`; access ends then even if the final
  `subscription.deleted` never arrives. A missed renewal never locks a payer
  out: period end alone doesn't revoke access.
- **One Stripe customer per user**, created on the first Checkout and
  reused. One trial per user: offered only if they never subscribed. With
  access, Checkout redirects to `/account/billing`; an open Checkout is reused.
- **"Start paying now"** ends a trial with `trial_end: "now"`. From the
  editor it also finishes the refused save; from the dashboard it opens a
  blank `/write`.
- **Lapse mid-session has no push**: the next save gets 403 and the editor
  invites to resubscribe, keeping the text on screen and editable.
