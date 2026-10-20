---
name: bdd-feature
description: Grill the user on a UI behaviour and write its Gherkin `.feature`, step 1 of the BDD flow.
disable-model-invocation: true
---

# BDD feature

Turns a task into an agreed `.feature` that two later agents consume: one writes
steps until it is **red**, another builds UI until it is **green** without
touching it. The feature is the contract; write it for them.

## Steps

1. **Gather.** Read the task (backlog entry or plan), [CONTEXT](../../../docs/CONTEXT.md)
   and the shared [step vocabulary](../../../e2e/VOCABULARY.md). Open other
   features only when the task extends them.
   Done when you know which actors, states and phrases already exist.
2. **Grill** (format in [AGENTS.md](../../../AGENTS.md#working-agreement)). Cover
   the happy path, every validation and error, logged-out vs logged-in states,
   what persists across reload/devices, and security edges (redirects,
   enumeration, who may see what). Done when every scenario's outcome is agreed
   and nothing is left as "we'll see".
3. **Write** `e2e/features/<area>.feature` by the rules below. Show it to the
   user. Done when they approve it.
4. **Record.** Decisions → the task's plan (routes, schemas, copy, anything the
   feature deliberately leaves out). Security decisions → [security notes](../../../docs/security-notes.md).
   Mark the plan's next step "steps, red (separate agent)". Commit.

## Feature rules

- **Declarative.** Behaviour in domain language: what the actor wants and what
  they observe. Routes, controls, layout and copy belong to the UI agent; write
  "they are told their email is invalid", "they are on the dashboard".
- Actors and nouns from CONTEXT (visitor, user, document…). A new term → add it
  there.
- One `Rule:` per business rule; `Scenario Outline` for variants of one rule.
- **Vocabulary first.** Reuse vocabulary phrases verbatim. A meaning it lacks
  that other features will need → write a general phrase and add it to the
  vocabulary. A meaning only this feature has → a local phrase, not listed.
- **Guard hidden intent.** When a value is chosen to prove something (a short
  password on login proves signup rules are not applied), comment it in caps
  above the scenario or examples so no one "fixes" it.
- Steps can drive several browsers, replay cookies and call the backend: a
  multi-device or server-side outcome is a valid scenario.
