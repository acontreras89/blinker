# Step vocabulary

Shared Gherkin phrases, reusable in any feature; their steps live in
[common.steps.ts](steps/common.steps.ts) once implemented. Load this instead of reading
every feature. Phrases specific to one feature stay in that feature and are not
listed here. `{…}` = parameter; actors and nouns from [CONTEXT](../docs/CONTEXT.md).

## Actors and sessions

- `a visitor opens the landing`
- `a registered user` · `a registered user who is not logged in`
- `a logged-in user` · `a user logged in on two devices`
- `they log in` · `they log out`
- `they are logged in` · `they are asked to log in`

## Navigation

- `they open {place}` · `they are on {place}` — places: `the landing`,
  `the dashboard`, `a blank editor`
- `they reload the page`
- `they start typing from the landing`

## Editing

- `they type {string}` · `they delete everything they typed`
- `the editor contains {string}` — the editor on screen, hero or app
- `the word count is {int}` · `the words per minute are above 0` ·
  `the words per minute are 0`

## Feedback

- `they are told {outcome}` — outcome in plain words (`their email is
invalid`); copy lives in the steps.
