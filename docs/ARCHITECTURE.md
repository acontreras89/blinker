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
  (`/app`, `/write`): `proxy.ts` bounces cookieless requests to
  `/login?next=…`, the page's `requireUser` does the real check. Logged in, `/login` → `/app`
  and `/signup` → `/write` ("Start typing" always ends in an editor).
- **Pay**: Server Action → backend creates a Checkout Session → Stripe → webhook
  (signature verified, idempotent) → `syncSubscription` → entitlement row. If
  the webhook is late, the return page runs the same sync from the Stripe API
  ([ADR-0009](adr/0009-sync-entitlements-from-stripe.md)); the redirect alone
  never grants access.
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
  server/         Hono app; never imports next/*
    auth/         Better Auth config + session middleware
    db/           Drizzle schema (plural tables) and migrations
    documents/    routes, use cases, rules shared with the UI
    e2e.ts        test-only seeding, off unless E2E_SEED=on
    billing/      getAccess, sync, webhook; BillingGateway: Stripe or a fake
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
