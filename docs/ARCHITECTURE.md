# Architecture

Map of the code for a newcomer. Why each choice: [ADL](ADL.md). Diagram sources
and images, if any, go to `docs/img/`.

## Bird's eye view

One Next.js app serving the marketing site and the editor. Next is only the
frontend; the backend is a Hono app running in the same process, called from
Next server code, never from the browser. SQLite is the only store.

```
browser ──► Next.js (pages, Server Components, Server Actions)
                │ in-process typed client (hc + app.request)
                ▼
            Hono backend ──► Drizzle ──► SQLite file
                ▲
Stripe ─────────┘ /api/webhooks/stripe     (also public: /api/auth/*)
```

## Flows

- **Auth**: forms (browser) → Better Auth at `/api/auth/*` → session row +
  httpOnly cookie. Every backend call re-reads the session from the DB; Next
  pages read it through `lib/session.ts` (backend `/session`). Private routes
  (`/app`, `/write`, `/billing`, `/account`): `proxy.ts` bounces cookieless requests to
  `/login?next=…`, the page's `requireUser` does the real check. Logged in, `/login` → `/app`
  and `/signup` → `/write` ("Start typing" always ends in an editor).
- **Pay**: form + Server Action (`billing/actions.ts`; never a link, Next
  would prefetch it and open Checkouts) → backend creates or reuses a Checkout
  Session → Stripe → webhook (signature verified, idempotent) →
  `syncSubscription` → entitlement row. `/billing/return` checks the DB and,
  if the webhook is late, runs the same sync from the Stripe API, polling
  ~10 s ([ADR-0009](adr/0009-sync-entitlements-from-stripe.md)); the redirect
  alone never grants access. `/account/billing` shows the state and opens the
  Customer Portal.
- **Edit**: `/write` (new, created on first save, URL replaced) or
  `/write/[id]` (server-rendered) → `use-saver.ts` (⌘S/button, 1 s idle
  autosave, flush on hide) → Server Actions in `app/(app)/actions.ts` →
  backend checks access → document JSON saved, stale autosaves refused.

## Code map

```
src/
  app/            Next routes: (marketing), (auth), (app); route-only
                  components live next to their route in `_components/`
  components/     shared UI: shadcn/ui primitives, editor (Tiptap Simple Editor)
  hooks/          per-device prefs (`use-stored`), touch detection
  proxy.ts        optimistic redirect to log in (cookie presence only)
  lib/api.ts      in-process backend client, server-only
  lib/session.ts  current user for Server Components; auth-client.ts for forms
  lib/documents.ts the user's documents, for Server Components/Actions
  lib/billing.ts  the user's access, Checkout and Portal, same way
  server/         Hono app; never imports next/*
    auth/         Better Auth config + session middleware
    db/           Drizzle schema (plural tables) and migrations
    documents/    routes, use cases, rules shared with the UI
    e2e.ts        test-only seeding, off unless E2E_SEED=on
    billing/      getAccess, sync, webhook; BillingGateway: Stripe or a fake
                  (`BILLING_GATEWAY=fake`, e2e only; fake Checkout/Portal
                  pages under `app/(app)/billing/fake-*`)
e2e/
  features/       Gherkin, written before the UI
  steps/          playwright-bdd step definitions
```

## Invariants

- Every backend route validates input with Zod and checks session and access in
  middleware; Next never decides authorization alone.
- Entitlements are written only by the server, from data read from Stripe.
- Document content is ProseMirror JSON, never HTML.

## Tests

- Vitest next to the code for domain rules (`getAccess`, webhook handling, limits).
- playwright-bdd for acceptance: each run gets a fresh temp SQLite file. Stripe
  Checkout is not driven in e2e: a fake `BillingGateway` stands in, and tests
  post webhooks signed with the test secret.

## Constraints and the real-product version

What shaped this code, and what we'd do with none of it. Deliberate, not
missed.

| Source | Constraint                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| Brief  | One web app for both surfaces; local hosting is fine; SQLite is fine                                       |
| Brief  | Out of scope: infra, collaboration, admin, email verification                                              |
| Ours   | ~8 h budget, 12 h cap; one reviewer must run it in <15 min ([ADR-0001](adr/0001-local-only-deployment.md)) |
| Ours   | One process, no Docker, no external services but Stripe                                                    |

Shortcuts taken for that size, named before a reviewer does:

- **One repo, one package.** A product would start as a monorepo: `apps/web`,
  `apps/api`, `packages/` for the shared rules (title, content limits) that
  `src/server/*/rules.ts` now shares by import.
- **Backend in-process.** Hono runs inside Next ([ADR-0005](adr/0005-next-frontend-hono-backend.md));
  a product would deploy it on its own, behind the same typed client.
- **Flat server modules.** Use cases query Drizzle directly: no repositories,
  ports/adapters, dependency injection or factories. All tables live in one
  `db/schema.ts`, next to the modules. Billing is the exception: its
  `BillingGateway` port exists because e2e needs a fake Stripe.
- **SQLite file.** Postgres with migrations in CI, backups and a connection
  pool for anything multi-instance.
- **Whole-document saves, last write wins** ([ADR-0008](adr/0008-document-persistence.md)).
  A product would send diffs and, past one writer, use a CRDT (Yjs).

What a customer would still miss (in [EX](BACKLOG.md#ex--extras-by-priority)
unless noted): password reset and email verification, account deletion and
export (GDPR), rate limiting beyond Better Auth's, error tracking and
structured logs, version history, deployment with HTTPS, transactional email
(receipts come from Stripe), real Terms/Privacy, and a support channel.
