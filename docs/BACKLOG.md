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

- [x] E7-01 README, E7-02 write-up → [README](../README.md), [WRITEUP](../WRITEUP.md)

## E8 — Polish

From the 2026-10-22 review (`NOTES.md`, local) plus the original E8 scope.

- [x] E8-01 Landing: phones on the LAN hydrate, hero fits short screens,
      cursors in step, theme switch.
- [x] E8-02 Editor chrome: edge-revealed bars with own pins, slides, tooltips,
      fixed counters, full-height text box, loading cursor, link field.
- [x] E8-03 Fireworks toggle in the editor.
- [x] E8-04 Cheeky copy: hero nag, dashboard empty state, trial prompt.
- [x] E8-05 Flow bugs: editor remounts on return (Activity), trial cap on
      `/write`, stats survive reloads, invalid-Checkout query dropped.
- [x] E8-06 Dashboard: dates, tap for exact dates, floating trial prompt.
- [x] E8-07 Code layout and dev request logs.
- [x] E8-08 ARCHITECTURE: constraints and the real-product version.
- [x] E8-09 Code block syntax highlighting (lowlight, monochrome).
- [x] E8-10 Header toggles cycle theme and header mode (was EX-17), toolbar
      slides, fixed-width counters.

## E9 — Demo and submission

- [x] E9-01 Demo run on real Stripe test mode → [demo.feature](../e2e/demo/demo.feature),
      `pnpm demo`, `pnpm demo:video`
- [x] E9-04 Demo video re-recorded → [docs/demo.mp4](demo.mp4) (1:54)
- [ ] E9-05 Fresh-install snags: pnpm blocks esbuild's build scripts
      (`ERR_PNPM_IGNORED_BUILDS`; allow or deny them in `pnpm-workspace.yaml`);
      `next build` sometimes races migrating the fresh SQLite file
      ("table `accounts` already exists"), failing the first `pnpm test:e2e`.
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
- [ ] EX-05 A second plan: lifetime one-time purchase (an entitlement row with
      no subscription) or a premium tier unlocking version history (EX-04).
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
- [ ] EX-16 Touch: formatting toolbar docked above the keyboard (visualViewport).
