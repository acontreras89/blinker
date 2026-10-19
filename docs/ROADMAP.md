# Roadmap

Epics and their order. Reorder freely as we learn; tasks live in [BACKLOG](BACKLOG.md).

Budget: ~8 h target, 12 h hard cap. Deadline: Mon 2026-10-26.

| Epic | Goal                                                                        |
| ---- | --------------------------------------------------------------------------- |
| E0   | Plan the process, scaffold docs and usage tracking                          |
| E1   | Decide stack and architecture (incl. BDD tooling); bootstrap the project    |
| E2   | Skeleton, DB and email/password auth with server-validated sessions         |
| E3   | Product and brand concept, light: name, positioning, tone, visual direction |
| E4   | Minimal landing                                                             |
| E5   | Minimal documents and editor (any logged-in user for now)                   |
| E6   | Stripe checkout, webhook and subscriber gating                              |
| E7   | Written deliverables: README and write-up                                   |
| E8   | Polish landing and editor; deepen the design concept                        |
| E9   | Demo video and submission                                                   |
| EX   | Extras, prioritized: the "what we'd do next" list                           |

## Why this order

- **Thin end-to-end first, polish later.** A minimal version of every surface
  (E2–E6) gives a working flow before any detail work; E8 spends what is left.
- **E3 early and light** because the landing copy needs a name and a tone.
- **Stripe after the editor** so payments have a real UI to unlock. Risk is
  covered by keeping E4/E5 minimal.
- **E7 before E8** so there is always something submittable.
- **Tests are not an epic**: every epic closes with its acceptance features.
