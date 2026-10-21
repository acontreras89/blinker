# E6 Billing and gating

Covers E6-01..02: Checkout, verified webhook, entitlements, gating, upgrade
path, visible status. Base: [ADR-0006](../adr/0006-own-billing-entitlements.md),
[ADR-0009](../adr/0009-sync-entitlements-from-stripe.md). Setup for humans:
[README](../../README.md#stripe-setup). Grilling in progress.

## Decisions

- **Kinds.** Monthly subscription + trial. Lifetime → EX-05. Trial: 3 days,
  1 document; constants (`TRIAL_DAYS`, `TRIAL_DOCUMENT_LIMIT`) shared by billing
  and the landing (`offer.ts`).
- **Active subscriber.** Create/edit/rename allowed when the subscription is
  `active` or `trialing`; `past_due` keeps it with a failed-payment banner
  while Stripe retries; lost on `unpaid` / `canceled` / `incomplete`.
  Canceled-at-period-end keeps it until `current_period_end`. Without it a user
  still logs in, reads (read-only) and deletes their documents. Server-side.
- **Sync.** Webhook and Checkout return share `syncSubscription`; the return
  page checks our DB first and calls Stripe only if access isn't there yet
  (ADR-0009). Processed `event.id`s are stored; replays are no-ops.
- **Flow.** Signup → Checkout → `/write`. Cancelled Checkout → `/app` as a
  non-subscriber.
- **Upgrade path.** Non-subscriber: fixed "Subscribe to start writing" banner
  in `/app`; "New document" opens Checkout; read-only editor shows the same CTA.
  Trial at the limit: creating a 2nd document shows "Your trial includes 1
  document" (backend 403 anyway). Copy polish → E8-04.
- **Status.** `/account/billing`: plan and state (trial ends / renews /
  past due / access until).
- **E2E.** A `BillingGateway` port: Stripe in dev/prod, a fake in e2e (local
  "checkout" page). Tests post webhooks signed with a test secret, so signature
  checks run for real. Real Stripe only for manual checks and the demo video.
- **Features.** `billing.feature` for now; fold its scenarios into the
  journey/auth features once E2 is done.

## Open

- Customer Portal (EX-01) for cancel / card / invoices vs own buttons.
- "Start paying now" (end trial early) in E6 or extra.
- One trial per user; test-key guard; events list; when the Customer is
  created.

## Steps

TBD after grilling.
