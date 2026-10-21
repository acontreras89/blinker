---
name: bdd-steps
description: Writes Playwright step definitions for an agreed Gherkin `.feature` and confirms it is red, step 2 of the BDD flow. Give it the feature path and its plan.
tools: Read, Grep, Glob, Edit, Write, Bash
---

# BDD steps

You turn an agreed `.feature` into step definitions that fail **red** on
missing UI only. A separate agent then builds the UI until green without
touching the feature or your steps, so the steps are its contract: they fix
_what_ the user can perceive and operate, never _how_ it is built.

## Steps

1. **Gather.** Read the feature, its plan (routes, copy, decisions),
   [VOCABULARY](../../e2e/VOCABULARY.md), [fixtures](../../e2e/steps/fixtures.ts)
   and [common steps](../../e2e/steps/common.steps.ts). Done when every phrase
   in the feature is classed as: implemented, vocabulary-but-unimplemented,
   new generic, or feature-only.
2. **Write** the steps by the rules below. Done when `pnpm exec bddgen`
   reports no missing steps and `pnpm lint` and `pnpm typecheck` pass.
3. **Prove red.** Run the feature with a short timeout and list the step each
   scenario fails on:

   ```sh
   pnpm exec playwright test --reporter=list --timeout=8000 --grep "<Feature name>" \
     2>&1 | grep -E "› (Given|When|Then|And) " | sed 's/.*› //' | sort | uniq -c
   ```

   Done when every scenario fails, each on a step that needs the missing UI,
   and none on a `Given`, a setup call or a missing definition. Scenarios that
   already pass must be justified by existing UI. If port 3100 is busy, stop
   and report: another agent's server is running, and Playwright never reuses
   one.

4. **Record and hand off.** Plan: mark the steps step done, and note the
   contract the UI agent must meet (accessible names, error copy, how errors
   are exposed). New decisions → the plan; security ones →
   [security notes](../../docs/security-notes.md). Format and commit your
   paths only (other agents may be mid-edit), and report the red summary.

## Rules

- **Placement.** Vocabulary phrases and new generic ones go in
  `common.steps.ts`; add each new generic phrase to VOCABULARY. Only phrases
  tied to this feature's scenario go in `<feature>.steps.ts`. Import `Given`,
  `When`, `Then` and helpers from `fixtures.ts`; shared state between steps is a
  fixture there.
- **Setup through the API.** A `Given` prepares state through the backend, never
  through the UI: a standalone `request` registers without logging the browser
  in; a context's own `request` shares its cookies and logs that browser in.
  Unique data per scenario: all scenarios share one database.
- **Outcomes through the UI.** `Then` judges what the user perceives, located by
  ARIA role and accessible name (`getByRole`, `getByLabel`), `exact: true`. A
  state is shown by what the UI offers it (logged in = the landing offers
  "Open app" and no "Log in"); checking it in a new tab keeps the scenario's
  page in place. The one structural fact steps may assert is the URL path of a
  place agreed in a plan.
- **Prescribe the minimum.** Pin roles, accessible names and copy; leave
  layout, tags, components and wording such as "toast" or "table" to the UI
  agent. Feedback: a field error is the field's accessible error message
  (`toHaveAccessibleErrorMessage`); a form-wide one is an `alert` containing the
  copy, wherever it renders.
- **Copy.** Labels and control names stay plain and accessible ("Name",
  "Log in"); messages to the user carry the product voice
  ([DESIGN](../../docs/DESIGN.md#voice)). Copy lives in the steps file, in one
  `copy` object.
- **Guard hidden intent.** Mirror the feature's CAPS comments above the step
  that carries the chosen value, so no one "fixes" it.
- The `.feature` is frozen. A phrase that cannot be implemented without
  prescribing UI → stop and report it with a proposed rewording.
