# Backlog

Coarse tasks grouped by [epic](ROADMAP.md). Flow and rules: [AGENTS.md](../AGENTS.md#planning-flow).

- `[ ]` todo · `[~]` in progress (date + state or plan link) · `[x]` done, one line + refs.

## E0 — Planning and scaffold

- [x] E0-01 Plan the process (grilling) → [AGENTS.md](../AGENTS.md), [ROADMAP](ROADMAP.md)
- [x] E0-02 Scaffold docs, backlog and usage tracking → [ADR-0001](adr/0001-local-only-deployment.md), `scripts/usage.mjs`

## E1 — Stack and architecture

- [x] E1-01 Grill stack and architecture → [ADR-0002..0007](ADL.md), [ARCHITECTURE](ARCHITECTURE.md)
- [x] E1-02 Bootstrap: Next + in-process Hono, shadcn, ESLint/Prettier, Vitest, smoke feature green

## E2 — Skeleton, DB, auth

- [x] E2-01 Auth: signup, login, logout, private routes → [auth.feature](../e2e/features/auth.feature), [security notes](security-notes.md)
- [x] E2-02 BDD flow: `bdd-feature` skill, [vocabulary](../e2e/VOCABULARY.md), `bdd-steps` and `bdd-ui` subagents

## E3 — Product and brand concept

- [x] E3-01 Brand and product concept: Blinker → [DESIGN](DESIGN.md), [styleguide](design/styleguide.html)

## E4 — Minimal landing

- [x] E4-01 Landing: live hero editor (shared Tiptap component), plan-driven pricing
- [x] E4-02 Meta/OG/favicon, 404/500 pages, Terms/Privacy stubs in the footer.

## E5 — Documents and editor

- [x] E5-01 Document list, create, rename, delete, hero draft → [documents.feature](../e2e/features/documents.feature)
- [x] E5-02 Save, autosave, failed-save handling, two tabs → [editor.feature](../e2e/features/editor.feature), [ADR-0008](adr/0008-document-persistence.md)
- [x] E5-03 Chromeless editor, toolbar on request, live stats → [editor.feature](../e2e/features/editor.feature)

## E6 — Stripe and gating

- [x] E6-01 Checkout, verified webhook, entitlements → [billing.feature](../e2e/features/billing.feature), [ADR-0009](adr/0009-sync-entitlements-from-stripe.md)
- [x] E6-02 Gating, upgrade path, status, Customer Portal → [billing.feature](../e2e/features/billing.feature)
- [ ] E6-03 Manual run against real Stripe test mode (Chrome + `stripe listen`):
      pay, decline, 3DS, Portal cancel, `past_due` via a test clock.

## E7 — Written deliverables

- [ ] E7-01 README: setup (<15 min), architecture, tradeoffs, Stripe test flow,
      known limitations, how AI was used.
- [ ] E7-02 Write-up: active subscriber rule, delayed webhook, one security decision
      ([security](security-notes.md), [Stripe](stripe-notes.md) notes).

## E8 — Polish

From the 2026-10-22 review (`NOTES.md`, local) plus the original E8 scope.

- [~] E8-01 Landing: hero editor starts scrolled, untypeable and overlapped on
  phones (LAN dev origin), synced cursors, theme switch (light/dark/system).
- [~] E8-02 Editor chrome: counters revealed at the bottom edge with their own
  pin (none on touch), slide in/out, header stays while hovered/focused,
  "until typing" waits, fixed counters the text never hides under, full-height
  text box, tooltips not titles (Save ⌘S), wider title button, tooltip delay,
  loading state, inline code contrast, link field; touch: toolbar docked to
  the keyboard, overflow hint.
- [~] E8-03 Fireworks toggle in the editor (off by default, locked off under
  reduced motion).
- [~] E8-04 Cheeky copy: hero nag (0 / 1 word), empty states, save feedback,
  trial-limit prompt.
- [~] E8-05 Flow bugs: back-navigation 500 (Tiptap view), stale header and
  "deleted elsewhere" after deleting, trial cap on `/write`, editor not
  refreshed after "Start paying now", `/app?checkout=invalid` joke kept on
  reload, `beforeunload` when saving can't
  work, stats lost on reload, needless saves while Saved.
- [~] E8-06 Dashboard: date format, tap for exact dates, floating upgrade
  prompt with a shake, dismissible toasts.
- [~] E8-07 Code layout: `draft.ts`/`stats.ts` to `lib/`, the stats hook to
  `hooks/`; Hono request logs in dev.
- [~] E8-08 ARCHITECTURE: constraints (brief, ours, time box), what a real
  product would do, server shortcuts named, what a customer would still miss.
- [ ] E8-09 Code block syntax highlighting: cost it; ship if cheap, else EX.

## E9 — Demo and submission

- [ ] E9-01 Demo feature composed from existing features/steps; slow-mo run
      script; record one video of the whole flow.
- [ ] E9-02 Fresh-machine check, push to GitHub, submission reply (repo, time,
      sprint questions).
- [ ] E9-03 Check every landing claim holds: autosave ("It saves", "Saved,
      Saving, or exactly what went wrong"), ⌘B/I/K + Markdown, toolbar on
      request, live words + WPM.

## EX — Extras (by priority)

- [ ] EX-02 Deploy to GCP (see [ADR-0001](adr/0001-local-only-deployment.md)).
- [ ] EX-03 OAuth login.
- [ ] EX-04 Version history: manual "save version" vs autosave checkpoints,
      history panel with preview and restore. E5 ships the minimal save only.
- [ ] EX-05 Lifetime one-time purchase (an entitlement row with no subscription).
- [ ] EX-06 Password reset and email verification.
- [ ] EX-07 Account deletion and data export (GDPR).
- [ ] EX-08 Rate limiting on auth.
- [ ] EX-09 Observability: structured logs, error tracking.
- [ ] EX-10 Document sidebar: the list on the left edge, revealed by the mouse,
      pinnable. Its empty-state Start typing then closes it and focuses the
      editor (changes `documents.feature`).
- [ ] EX-11 Autosave hardening: retry with backoff, local backup of unsaved
      changes (restore on reload, cleared on logout).
- [ ] EX-12 List sorting (name / last updated, user's choice) and folders.
- [ ] EX-13 Diff saves (ProseMirror steps) instead of the whole JSON ([ADR-0008](adr/0008-document-persistence.md)).
- [ ] EX-14 Keep unsaved text across resubscribing: a lapsed user's unsaved
      edits survive Checkout and are saved once access returns.
- [ ] EX-15 Editor font choice (from E8-03).
