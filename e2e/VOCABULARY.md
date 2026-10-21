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
- `a logged-in user with the documents {string}` — comma-separated titles,
  created in that order
- A `logged-in user` is an active subscriber unless the phrase says otherwise:
  `a logged-in user without a subscription` · `a logged-in user on a trial` ·
  `a logged-in user whose subscription is {state}` — states as in
  [billing.feature](features/billing.feature)

## Billing

- `they subscribe` — pays in Checkout and comes back
- `they are in Checkout` · `they are invited to subscribe`

## Navigation

- `they open {place}` · `they are on {place}` — places: `the landing`,
  `the dashboard`, `a blank editor`
- `they reload the page`
- `they are told the page does not exist`
- `they start typing from {place}` — its **Start typing** link

## Editing

- `they type {string}` · `they delete everything they typed`
- `the editor contains {string}` · `the editor does not contain {string}` — the
  editor on screen, hero or app
- `they save the document` — how is the UI's choice
- `the dashboard lists {string}` · `the dashboard does not list {string}` —
  comma-separated titles; judged in a new tab unless already there
- `the dashboard lists {string} in that order` — all of them, top first
- `they are told they have no documents yet`
- `the word count is {int}` · `the words per minute are above 0` ·
  `the words per minute are 0` · `they reset the stats`

## Feedback

- `they are told {outcome}` — outcome in plain words (`their email is
invalid`); copy lives in the steps.
