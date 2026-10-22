# Write-up

**Demo**: <!-- E9-01: video file in the repo --> landing → register → pay →
create, edit, save, rename and delete a document.

Setup, architecture and tradeoffs: [README](README.md).

## 1. How does the app decide a user is an active subscriber?

From our own `entitlements` table, one row per Stripe subscription, written
only by the server with data it read from the Stripe API
([ADR-0009](docs/adr/0009-sync-entitlements-from-stripe.md)).
[`getAccess`](src/server/billing/access.ts) grants access when a row's status
is `active`, `trialing` or `past_due` (Stripe is still retrying the card) and
its `cancelAt`, if any, hasn't passed. A trial is limited to one document.

The check runs in the backend on every create, edit and rename; without access
they answer 403 and the UI shows the upgrade path. Reading and deleting your
own documents always work: a lapsed user never has their data held hostage.

## 2. What happens if payment succeeds but the webhook is delayed?

The user still gets in. Stripe sends them back to `/billing/return` with a
`session_id`; if our DB doesn't grant access yet, the server fetches that
Checkout Session from Stripe, checks it is paid and belongs to the logged-in
user, and runs the same sync the webhook would. If Stripe itself hasn't
settled, the page shows "Confirming payment…" and asks again every 2 s for
10 s, then says writing unlocks as soon as Stripe confirms.

When the webhook arrives it runs that same idempotent sync; each event id is
stored, so replays are no-ops, and each sync writes Stripe's current state, so
event order doesn't matter. The redirect alone never grants anything: the
`session_id` is a pointer, not proof.

## 3. One security decision and why

**Authorization lives only in the backend.** Next.js Server Actions are
public POST endpoints whatever the UI shows, so Next never decides who may do
what. Every call goes to the Hono backend, whose middleware re-reads the
session from the database and checks access before any route runs
([ADR-0005](docs/adr/0005-next-frontend-hono-backend.md)). Another user's
document answers 404, like a missing one, so ids can't be probed. The
acceptance tests call the backend directly to prove the gate holds without
the UI.

Every other decision, one line each: [security notes](docs/security-notes.md).
