# Step vocabulary

Shared Gherkin phrases, reusable in any feature. Load this instead of reading
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

- `they type {string}`
- `the editor contains {string}`

## Feedback

- `they are told {outcome}` — outcome in plain words (`their email is
invalid`); copy lives in the steps.
