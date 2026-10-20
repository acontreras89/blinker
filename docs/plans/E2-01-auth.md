# E2-01 Auth

Register, log in, log out with server-validated sessions. Behaviour:
[auth.feature](../../e2e/features/auth.feature). First real run of the
[BDD flow](../../AGENTS.md#feature-flow-bdd--provisional).

## Decisions

- Routes: `/signup`, `/login` in `(auth)`; private `/app` (dashboard) and
  `/write` (new document) in `(app)`. Logged-in users hitting auth pages go to
  `/app`.
- Register: name (required, trimmed, ≤ 50), email, password (≥ 8). Auto login,
  lands on `/write`. Stripe slots in between in E6.
- Validation: one Zod schema shared by forms and backend; own messages, no
  browser validation (`noValidate`). On submit, then live on fields with errors.
  Login validates the email format only; password rules apply to signup only so
  rule changes never lock out old accounts.
- Login failure: one generic message for wrong password and unknown email.
- Return path: private pages send visitors to `/login?next=…`; `next` must be a
  known private route, else `/app` ([security notes](../security-notes.md)).
- Sessions: Better Auth DB sessions, default 7-day expiry, several per user;
  logout revokes the current one on the server and lands on `/login`.
- Landing CTAs: "Start typing" always ends in a blank editor (via signup for
  visitors); logged in, "Log in" becomes "Open app" → `/app`.
- `/write` mounts the shared editor from E4 (`src/components/editor/`) seeded
  with the hero's `localStorage` draft. Saving it as a document is E5.

## Out of scope

- Email verification, password reset, rate limiting (→ README limitations).
- Documents and dashboard content (E5); `/app` is a placeholder.

## Steps

1. [x] Grilling → `auth.feature`.
2. [x] Better Auth + Drizzle (`better-sqlite3`), migrations in `drizzle/` run on
       boot. Rules in `src/server/auth/rules.ts` (shared with forms), enforced by a
       Better Auth `before` hook; `safeNext` in `src/lib/safe-next.ts`. Statuses:
       invalid 400, duplicate email 422, bad credentials 401.
3. [ ] Step definitions, confirm red (separate agent). Fresh SQLite per run → unique emails per
       scenario; second device = `browser.newContext()`; rejected session =
       replay the old cookie against the backend.
4. [ ] UI until green (separate agent, `.feature` untouched).
5. [ ] `pnpm check` + e2e green, ARCHITECTURE/CONTEXT touched up, plan deleted.
