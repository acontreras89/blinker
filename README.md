# Blinker

A focused rich text editor for professionals who should be writing and
procrastinate instead: a blank page, a cursor, and a subscription. Built as a
take-home assignment; the write-up and the demo are in [WRITEUP.md](WRITEUP.md).

## Quickstart

Needs Node 24 (`.nvmrc`), pnpm (via Corepack) and a free Stripe account with
the [Stripe CLI](https://docs.stripe.com/stripe-cli).

```sh
nvm use && corepack enable
pnpm install
cp .env.example .env    # set BETTER_AUTH_SECRET: openssl rand -base64 32
```

Then the [Stripe setup](#stripe-setup) (keys into `.env`, `pnpm stripe:setup`),
and in two terminals:

```sh
pnpm dev                # http://localhost:3000; the SQLite file is created and migrated on boot
stripe listen --all-snapshot --forward-to localhost:3000/api/webhooks/stripe
```

All variables are listed in [.env.example](.env.example). No secrets are
committed; the server refuses to start without test-mode Stripe keys.

## Architecture

One Next.js app: Next is only the frontend; the backend is a Hono app in the
same process, called in-process from Next server code, never from the browser.
SQLite through Drizzle is the only store.

```
browser ──► Next.js (pages, Server Components, Server Actions)
                │ in-process typed client (hc + app.request)
                ▼
            Hono backend ──► Drizzle ──► SQLite file
                ▲
Stripe ─────────┘ /api/webhooks/stripe     (also public: /api/auth/*)
```

Flows, code map and invariants: [ARCHITECTURE](docs/ARCHITECTURE.md).
Every decision: [decision log](docs/ADL.md).

## Tradeoffs

- **Local only**, no cloud deploy; webhooks reach it through the Stripe CLI
  ([ADR-0001](docs/adr/0001-local-only-deployment.md)).
- **SQLite file**, no DB server to install; Postgres is a dialect swap
  ([ADR-0002](docs/adr/0002-sqlite-drizzle.md)).
- **Better Auth** instead of hand-rolled auth: DB sessions, httpOnly cookie
  ([ADR-0003](docs/adr/0003-better-auth.md)).
- **Hono backend in-process**: a real boundary (session and access checked in
  its middleware) without a second process
  ([ADR-0005](docs/adr/0005-next-frontend-hono-backend.md)).
- **Own billing module** over a plugin: entitlements synced from Stripe, by
  webhook or on return from Checkout
  ([ADR-0006](docs/adr/0006-own-billing-entitlements.md),
  [ADR-0009](docs/adr/0009-sync-entitlements-from-stripe.md)).
- **Documents as ProseMirror JSON**, never HTML; whole-document saves; a stale
  autosave is refused, an explicit save wins with a warning
  ([ADR-0007](docs/adr/0007-tiptap-json.md),
  [ADR-0008](docs/adr/0008-document-persistence.md)).
- **Autosave plus manual save** (⌘S): 1 s after typing stops, and on leaving
  the page.
- **Acceptance tests don't drive Stripe Checkout**: a fake gateway stands in,
  webhooks are signed with a test secret
  ([ADR-0004](docs/adr/0004-playwright-bdd.md)).
- **Cut on purpose**, out of the brief's scope or the time box: emails of any
  kind (password reset, verification), observability, cloud deploy, payment
  methods other than card, refunds and disputes.

What a real product would do differently: [ARCHITECTURE](docs/ARCHITECTURE.md).

## Known limitations

<!-- To review. -->

- Losing access mid-session is noticed on the next save, not pushed.
- Unsaved text lives only in the open tab: if the server is unreachable,
  closing it loses the changes (the browser warns first).
- Two tabs on one document don't merge: an explicit save overwrites the other
  tab's work, with a warning.
- Every save sends the whole document (capped at 1 MB).
- The price is a constant shared by the landing and `stripe:setup`, not read
  from Stripe.
- Real Stripe Checkout is not covered by the automated tests (a fake gateway
  stands in); the demo run is the end-to-end check.

## With another day

Product first:

- Autosave hardening: retry with backoff, a local backup of unsaved changes
  restored on reload (EX-11).
- Version history: checkpoints, preview and restore (EX-04).
- A second plan: a one-time lifetime pass, or a premium tier that unlocks
  version history (EX-05).

Full list: [backlog extras](docs/BACKLOG.md#ex--extras-by-priority).

## Stripe setup

Test mode only; no real money moves. You need a free Stripe account.

1. Install the Stripe CLI: `brew install stripe/stripe-cli/stripe` (other
   platforms: [docs](https://docs.stripe.com/stripe-cli)), then `stripe login`.
2. In the Dashboard, switch to test mode (or a sandbox) → Developers → API
   keys. Copy the secret key (`sk_test_…`) into `.env` as `STRIPE_SECRET_KEY`.
3. `stripe listen --print-secret` → copy the `whsec_…` into `.env` as
   `STRIPE_WEBHOOK_SECRET`. It is stable per machine and account.
4. `pnpm stripe:setup` creates the product, the monthly price and the
   Customer Portal settings in your test account; safe to re-run. The server
   refuses to start without an `sk_test_` key and a `whsec_` secret.
5. While the app runs, keep webhooks forwarded in another terminal:
   `stripe listen --all-snapshot --forward-to localhost:3000/api/webhooks/stripe`.

## Stripe test flow

Sign up from the landing → Stripe Checkout (3-day trial, 1 document) → pay →
back in the editor. Account → Billing shows the status and opens the Customer
Portal (cancel, update the card). Without `stripe listen` the payment still
lands, synced on return from Checkout; Portal changes then never arrive.

Test cards (any future date, any CVC, any postcode):

| Card                  | Result                                       |
| --------------------- | -------------------------------------------- |
| `4242 4242 4242 4242` | Paid                                         |
| `4000 0000 0000 0002` | Declined                                     |
| `4000 0025 0000 3155` | Asks for 3D Secure                           |
| `4000 0000 0000 0341` | Saved, but charges fail (renewal → past due) |

## Tests

```sh
pnpm check                              # format, lint, typecheck, unit tests (Vitest)
pnpm exec playwright install chromium   # once
pnpm test:e2e                           # acceptance features on a production build
```

Acceptance tests are Gherkin features written before the UI
([e2e/features](e2e/features)), run with playwright-bdd on a fresh SQLite
file per run.

## How AI was used

Built with Claude Code; I steered, reviewed and decided. The rules every agent
follows are in [AGENTS.md](AGENTS.md).

- **Per task**: a grilling session (the agent asks, I answer by voice) →
  a plan in `docs/plans/` → ADRs as decisions are made → behaviour as a
  `.feature` ([`bdd-feature` skill](.claude/skills/bdd-feature)) → step
  definitions until red, then UI until green, each in its own subagent
  context ([`bdd-steps`, `bdd-ui`](.claude/agents)).
- **Across tasks**: several of those sessions in parallel, staggered so they
  don't touch the same code. The real order is in
  [worklog.csv](docs/worklog.csv), not the backlog's.
- **Review**: while agents ran on their own, I read their output in other
  sessions and turned what I found into tasks (the E8 polish list came from
  one such review).

## Time spent

<!-- Refreshed at submission (E9-02). -->

About 8h30 of my time so far; per epic, task and session, with tokens and
estimated cost, in the [worklog](docs/WORKLOG.md). Figures are estimates:
parallel sessions overlap, agents kept working through my breaks (not
counted), and hitting the subscription's 5-hour limit cost some rework.
