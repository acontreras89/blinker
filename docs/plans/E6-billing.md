# E6 Billing and gating

Covers E6-01..02: Checkout, verified webhook, entitlements, gating, upgrade
path, visible status. Base: [ADR-0006](../adr/0006-own-billing-entitlements.md),
[ADR-0009](../adr/0009-sync-entitlements-from-stripe.md). Setup for humans:
[README](../../README.md#stripe-setup). Notes for the write-up:
[Stripe notes](../stripe-notes.md). Grilled 2026-10-21; steps 1–2 done, next:
3 and 4.

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
- **Entitlements.** One row per Stripe subscription (renewals update it,
  resubscribing adds a row); one-time purchases would add their own rows.
  `getAccess` looks for any row granting access now.
- **Checkout.** Card only (`payment_method_types: ["card"]`).
- **Return page.** `success_url` → `/billing/return?session_id=…`: DB first,
  else sync from the API, then redirect to `/write`. With card only, Checkout
  redirects after the payment is settled (`paid`, or `no_payment_required` on
  trial), so waiting means Stripe is unreachable: the page itself shows
  "Confirming payment…", retries ~10 s, then says writing unlocks as soon as
  Stripe confirms, linking to `/app`. No write-without-save mode.
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
- **Features.** The signup journey (landing → register → Checkout → editor)
  lives in `auth.feature`; everything else billing in `billing.feature`.
  `a logged-in user` is an active subscriber (see e2e vocabulary).
- **Invalid return** (another user's or unknown `session_id`): dashboard with a
  joke, "Trying to impersonate someone else, huh? Stop messing around and
  subscribe to start typing!". Own unpaid session = `pending`, not invalid.
- **Lapse mid-session.** No push: the next save (manual or autosave) gets 403;
  the editor says so, keeps the text on screen and invites to subscribe.
- **CTA copy** (E8-04 polishes): "Subscribe to start writing" for never-paid,
  "Resubscribe to keep writing" for lapsed.
- **Trial limit.** "Start paying now" ends the trial and lands on a blank
  editor; the refused document is not created by itself.
- **Fake gateway guard.** No `NODE_ENV` check: e2e runs `next start`
  (production). Opt-in only via `BILLING_GATEWAY=fake`, set by the Playwright
  config; the app is local-only (ADR-0001).

## Steps

1. [x] Schema (`stripe_customer_id`, `entitlements`, `stripe_events`) +
       `getAccess` with Vitest.
2. [x] `BillingGateway` (Stripe + fake), `syncSubscription`, webhook, return
       page sync; Vitest. Test-key guard. `pnpm stripe:setup` (price + Portal).
       Contract for step 3, in `src/server/billing/`:
   - Backend (`routes.ts`, cookie user): `GET /billing` (access or null),
     `POST /billing/checkout` → `{url}` or `{redirect}`,
     `POST /billing/return {sessionId}` → `ready|pending|invalid`,
     `POST /billing/trial/end` (409 if not trialing), `POST /billing/portal` →
     `{url}` (409 without a customer).
   - Fake (`fake.ts`, `BILLING_GATEWAY=fake` in e2e and Vitest): Checkout URL
     `/billing/fake-checkout/:id`, Portal `/billing/fake-portal?customer=…`;
     those pages don't exist yet. `fakeBilling.complete(id)` pays and returns
     the `success_url`; `fakeBilling.update(subId, …)` changes state before a
     signed webhook. The browser reaches them only through an e2e route
     (`e2e.ts`). E2E webhook secret: `whsec_e2e_secret`.
3. [~] Feature agreed, parked in `e2e/pending/` (undefined steps break
   `bddgen` for agents running e2e). Next: steps, red (separate agent),
   once E5's UI agent is done: move `billing.feature` into
   `e2e/features/`, apply `auth.feature.patch`, add `And they subscribe`
   after registering in `editor.feature` ("A visitor's draft becomes their
   first document"), make `a logged-in user` subscribe in
   `common.steps.ts`, delete `e2e/pending/`. Then UI green (`bdd-ui`):
   Checkout after signup, fake Checkout/Portal pages, return page, upgrade
   path, trial limit + "Start paying now", `/account/billing`, Portal
   button.
4. [ ] Plug `getAccess` into E5's document middleware (likely done by then):
       403 on create/edit/rename without access; read and delete stay open.
5. [ ] Manual run against real Stripe test mode (Chrome + `stripe listen`):
       pay, decline, 3DS, Portal cancel, `past_due` via a test clock.
6. [ ] `pnpm check` + e2e green; README Stripe flow, CONTEXT, ARCHITECTURE
       touched up; leftovers moved; plan deleted.
