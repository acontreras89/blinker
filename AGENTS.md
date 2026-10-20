# AGENTS.md

Take-home assignment for LeadTech: a web rich text editor with a marketing site,
email/password auth and Stripe (test mode) subscriptions. The brief is local and
uncommitted: `take-home-assignment-web-deployed-rich-text-editor.md` (text
transcript of the `.pdf`; read the `.md`).

## Rule #1: be terse

Every doc here is alive for the whole project and must stay as short as possible.
Write the minimum that lets the next agent act. No restating what another doc
says: link it. Prefer deleting over appending.

## Where things live

Load only what the task needs.

| What                              | Where                                        |
| --------------------------------- | -------------------------------------------- |
| Epics, order and why              | [docs/ROADMAP.md](docs/ROADMAP.md)           |
| Tasks and their status            | [docs/BACKLOG.md](docs/BACKLOG.md)           |
| Live plans                        | `docs/plans/`                                |
| Decisions (index → ADRs)          | [docs/ADL.md](docs/ADL.md)                   |
| Architecture                      | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Code style, commits               | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |
| Ubiquitous language               | [docs/CONTEXT.md](docs/CONTEXT.md)           |
| Product, brand, tone, visual line | [docs/DESIGN.md](docs/DESIGN.md)             |
| Time and token log                | [docs/WORKLOG.md](docs/WORKLOG.md)           |
| Deliverables for reviewers        | [README.md](README.md)                       |

## Working agreement

- Talk to the user in Spanish; everything committed is in English.
- Grilling: questions as plain text (not the question tool), batches of ~5, each
  with a recommended answer. The user dictates by voice.
- Ask before meaningful changes; the user decides, the agent finds facts.
- Run Prettier on every file you write, Markdown included, before committing
  (`pnpm format`); it reflows tables and lists.

## Session protocol

**Start:** read this file → open [BACKLOG](docs/BACKLOG.md) → pick a task and
mark it `[~]`. If the task points to a plan, work from the plan only.

**During:** write an ADR as soon as a decision is made, not at the end.

**End:** update the task (or plan) state so another agent can resume → commit.
At the end of a work block, also log it (below).

## Planning flow

1. A backlog task is coarse: title, 1–2 line description, optional decision notes.
2. A task that needs it starts with a grilling session that outputs a plan in
   `docs/plans/<task-id>-<slug>.md`: scope, out of scope, steps with checkpoints.
   A plan may cover a whole epic or only its first stage.
3. While a plan is alive, the backlog entry just links to it.
4. What was grilled goes to the plan. Follow-ups not grilled yet go to the
   backlog as one-liners (extras to `EX`).
5. Done: everything that survives is already moved (ADRs, docs, backlog) → plan
   deleted → task collapsed to one line.

Small tasks skip the plan and keep their state in the backlog entry.

## Feature flow (BDD) — provisional

UI behaviour is specified before it is built, with Playwright + Gherkin:

1. Grilling on the behaviour → a declarative `.feature`: `/bdd-feature`.
2. An agent writes the step definitions and confirms the scenario is **red**.
   Steps locate by accessible role and name only and prescribe as little UI as
   possible.
3. A separate agent builds the UI until it is **green**, without editing the
   `.feature`. UI decisions are made here: prototype freely, any UI that passes
   is valid.

To be refined on its first real use (E2), likely into a project skill plus two
subagents (steps / implement) so red and green run in separate contexts.

## Commits

See [CONTRIBUTING](docs/CONTRIBUTING.md#commits). Fixing an earlier commit of
ours → `fixup` + rebase onto it, not a new unrelated commit. No push until E9.

## Worklog

At the end of each work block (ask the user the real end time). The worklog is
the last thing touched: close everything first (task/plan state, backlog,
docs, commits), skipping pending validations if needed. If something can't be
closed, ask before logging; never log with work pending.

1. Close/add rows in [docs/worklog.csv](docs/worklog.csv): one row per epic/task
   touched, with the Claude session id (`date,block,start,end,epic,task,claude_session,note`).
2. Run `node scripts/usage.mjs` to regenerate `docs/WORKLOG.md`.
3. Commit both.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
