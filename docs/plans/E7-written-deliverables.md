# E7 — Written deliverables

Grilled 2026-10-22. ARCHITECTURE owns constraints and the real-product version (E8-08); the
README only links to it.

## Scope

- `README.md`, setup first, each section short with the detail linked:
  Blinker one-liner (links WRITEUP) → Quickstart (<15 min) → Architecture →
  Tradeoffs → Known limitations → With another day → Stripe test flow →
  Tests → How AI was used → Time spent.
- `WRITEUP.md` (~1 page): demo video link (file in the repo, E9-01), the
  brief's three answers, one security decision highlighted, rest linked to
  [security notes](../security-notes.md).
- AI section: per-session flow (grilling → plan → ADRs → BDD red/green in
  separate subagent contexts); staggered parallel sessions, real order in
  `worklog.csv`; human review while agents worked; links to AGENTS.md,
  `.claude/agents/`, the `bdd-feature` skill, WORKLOG totals. Times are
  estimates (parallel overlap, the 5 h subscription limit, AFK breaks).

## Out of scope

- No demo mode without Stripe: reviewers pay by hand.
- Final numbers (time, cost) are refreshed right before submitting (E9-02).
- Session branch diagram: last, optional.

## Steps

1. [x] README draft; tradeoffs, cuts and "with another day" reviewed.
2. [x] WRITEUP draft.
3. [x] Cross-reference with E8-08's ARCHITECTURE.
4. [ ] User review: Known limitations (`<!-- To review. -->`), WRITEUP.
5. [ ] Demo link once E9-01 records it; time refreshed in E9-02.
