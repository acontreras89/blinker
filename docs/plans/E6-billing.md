# E6 Billing and gating

Covers E6-01..02: Checkout, verified webhook, entitlements, gating, upgrade
path, visible status. Base: [ADR-0006](../adr/0006-own-billing-entitlements.md),
[ADR-0009](../adr/0009-sync-entitlements-from-stripe.md). Setup for humans:
[README](../../README.md#stripe-setup). Notes for the write-up:
[Stripe notes](../stripe-notes.md). Grilling in progress.

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
  document" (backend 403 anyway) with "Start paying now" (ends the trial,
  `trial_end: "now"`). Copy polish → E8-04.
- **One trial per user.** Offered only if the user never had a subscription.
- **Customer.** Created in Stripe on the first Checkout, `customer_id` stored
  on the user and reused.
- **No double Checkout.** With access → `/account/billing`; an open Checkout
  is reused.
- **Events.** See [Stripe notes](../stripe-notes.md); all trigger a sync.
- **Keys.** The server refuses to boot unless `STRIPE_SECRET_KEY` is `sk_test_`.
- **Status.** `/account/billing`: plan and state (trial ends / renews /
  past due / access until) and "Manage billing" → Customer Portal session
  (cancel at period end, card, invoices). Portal config created by
  `stripe:setup`. E2E checks only the redirect to the fake; the real Portal is
  tested by hand.
- **E2E.** A `BillingGateway` port: Stripe in dev/prod, a fake in e2e (local
  "checkout" page). Tests post webhooks signed with a test secret, so signature
  checks run for real. Real Stripe only for manual checks and the demo video.
- **Features.** `billing.feature` for now; fold its scenarios into the
  journey/auth features once E2 is done.

## Open

- Entitlement model: one row per subscription (history) vs one per user.

## Steps

1. [ ] Schema (`stripe_customer_id`, `entitlements`, `stripe_events`) +
       `getAccess` with Vitest.
2. [ ] `BillingGateway` (Stripe + fake), `syncSubscription`, webhook, return
       page sync; Vitest. Test-key guard. `pnpm stripe:setup` (price + Portal).
3. [ ] `/bdd-feature` → `billing.feature`; steps red (`bdd-steps`); UI green
       (`bdd-ui`): Checkout after signup, return page, upgrade path, trial
       limit + "Start paying now", `/account/billing`, Portal button.
4. [ ] Plug `getAccess` into E5's document middleware (likely done by then):
       403 on create/edit/rename without access; read and delete stay open.
5. [ ] Manual run against real Stripe test mode (Chrome + `stripe listen`):
       pay, decline, 3DS, Portal cancel, `past_due` via a test clock.
6. [ ] `pnpm check` + e2e green; README Stripe flow, CONTEXT, ARCHITECTURE
       touched up; leftovers moved; plan deleted.
