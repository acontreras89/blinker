# Backlog

Coarse tasks grouped by [epic](ROADMAP.md). Flow and rules: [AGENTS.md](../AGENTS.md#planning-flow).

- `[ ]` todo · `[~]` in progress (date + state or plan link) · `[x]` done, one line + refs.

## E0 — Planning and scaffold

- [x] E0-01 Plan the process (grilling) → [AGENTS.md](../AGENTS.md), [ROADMAP](ROADMAP.md)
- [x] E0-02 Scaffold docs, backlog and usage tracking → [ADR-0001](adr/0001-local-only-deployment.md), `scripts/usage.mjs`

## E1 — Stack and architecture

- [x] E1-01 Grill stack and architecture → [ADR-0002..0007](ADL.md), [ARCHITECTURE](ARCHITECTURE.md)
- [ ] E1-02 Bootstrap: install, lint/format/typecheck, `.env.example`, a smoke
      feature running green.

## E2 — Skeleton, DB, auth

- [ ] E2-01 Register, log in, log out with server-validated sessions; logged-out
      vs logged-in UI states. First real run of the BDD flow.
- [ ] E2-02 Extract the BDD flow into a skill + subagents.

## E3 — Product and brand concept

- [ ] E3-01 Grill name, positioning, tone and visual direction → DESIGN (light).
      Note: the user wants a cheeky, transgressive landing.

## E4 — Minimal landing

- [ ] E4-01 Value proposition, CTA, pricing, trust elements; responsive.

## E5 — Documents and editor

- [ ] E5-01 Document list (title, last updated), create with default title,
      rename, delete with confirmation, empty states.
- [ ] E5-02 Rich text editing and save to backend, failed-save handling.

## E6 — Stripe and gating

- [ ] E6-01 Checkout + verified webhook → entitlements ([ADR-0006](adr/0006-own-billing-entitlements.md)).
      Subscription + one of trial/lifetime; the other goes to EX-05.
- [ ] E6-02 Server-side gating, non-subscriber/subscriber UI states, upgrade
      path, visible subscription status.

## E7 — Written deliverables

- [ ] E7-01 README: setup (<15 min), architecture, tradeoffs, Stripe test flow,
      known limitations, how AI was used.
- [ ] E7-02 Write-up: active subscriber rule, delayed webhook, one security decision.

## E8 — Polish

- [ ] E8-01 Deepen DESIGN and polish the landing.
- [ ] E8-02 Polish the editor UX.

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
