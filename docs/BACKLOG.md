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

- [~] E2-01 Auth → [plan](plans/E2-01-auth.md)
- [~] E2-02 Extract the BDD flow into a skill + subagents. Done: `bdd-feature`
  (step 1) + [vocabulary](../e2e/VOCABULARY.md); left: steps/red and UI/green
  subagents; landing stats steps use test ids → accessible queries.

## E3 — Product and brand concept

- [x] E3-01 Brand and product concept: Blinker → [DESIGN](DESIGN.md), [styleguide](design/styleguide.html)

## E4 — Minimal landing

- [x] E4-01 Landing: live hero editor (shared Tiptap component), plan-driven pricing
- [x] E4-02 Meta/OG/favicon, 404/500 pages, Terms/Privacy stubs in the footer.

## E5 — Documents and editor

- [ ] E5-01 Document list (title, last updated), create with default title,
      rename, delete with confirmation, empty states. The landing hero draft
      (`localStorage`) becomes the first document after signup.
- [ ] E5-02 Rich text editing and save to backend, failed-save handling. Same
      document in two tabs: last write wins, but warn.
- [ ] E5-03 Chromeless editor: shortcuts + Markdown input rules, toolbar on request
      (Simple Editor's toolbar hidden by default); live words + WPM.

## E6 — Stripe and gating

- [ ] E6-01 Checkout + verified webhook → entitlements ([ADR-0006](adr/0006-own-billing-entitlements.md)).
      Subscription + one of trial/lifetime; the other goes to EX-05.
- [ ] E6-02 Server-side gating, non-subscriber/subscriber UI states, upgrade
      path, visible subscription status (incl. `past_due` / failed payment).

## E7 — Written deliverables

- [ ] E7-01 README: setup (<15 min), architecture, tradeoffs, Stripe test flow,
      known limitations, how AI was used.
- [ ] E7-02 Write-up: active subscriber rule, delayed webhook, one security decision
      ([notes](security-notes.md)).

## E8 — Polish

- [ ] E8-01 Deepen DESIGN and polish the landing.
- [ ] E8-02 Polish the editor UX.
- [ ] E8-03 Editor settings: counter pop toggle (off by default, locked off under
      reduced motion), font choice.
- [ ] E8-04 Cheeky copy in mouse-driven moments: empty states, save feedback, sidebar,
      trial-limit upgrade prompt.

## E9 — Demo and submission

- [ ] E9-01 Demo feature composed from existing features/steps; slow-mo run
      script; record one video of the whole flow.
- [ ] E9-02 Fresh-machine check, push to GitHub, submission reply (repo, time,
      sprint questions).

## EX — Extras (by priority)

- [ ] EX-01 Stripe Customer Portal ("Manage billing").
- [ ] EX-02 Deploy to GCP (see [ADR-0001](adr/0001-local-only-deployment.md)).
- [ ] EX-03 OAuth login.
- [ ] EX-04 Version history: manual "save version" vs autosave checkpoints,
      history panel with preview and restore. E5 ships the minimal save only.
- [ ] EX-05 Whichever of trial (7 days, card, 3 docs) / lifetime E6 skipped.
- [ ] EX-06 Password reset and email verification.
- [ ] EX-07 Account deletion and data export (GDPR).
- [ ] EX-08 Rate limiting on auth.
- [ ] EX-09 Observability: structured logs, error tracking.
