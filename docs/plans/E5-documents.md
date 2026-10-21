# E5 Documents and editor

Covers E5-01..03: list, create, edit, save, rename, delete, chromeless editor.
Any logged-in user for now; E6 plugs `getAccess` into the same middleware.
Persistence model: [ADR-0008](../adr/0008-document-persistence.md). Behaviour:
[documents.feature](../../e2e/features/documents.feature) (the list) and
[editor.feature](../../e2e/features/editor.feature) (inside a document).

E2-01 is green; its `/app` and `/write` are placeholders to rebuild.

## Decisions

- **Routes.** `/app` lists documents; `/write` is a blank editor, the document
  is created on its first save and the URL becomes `/write/[id]` (replace, no
  reload). `/write/[id]` renders server-side with its content; unknown or
  foreign id → the 404 page.
- **Titles.** Server assigns `Untitled`, `Untitled (1)`, `Untitled (2)`… on
  create: lowest free number among the user's documents. Rename: trimmed, empty
  restores the previous title, duplicates allowed (identity is the id), bumps
  `updatedAt`. Over 100 chars: the input accepts it, confirming is refused with
  a cheeky message and the input stays open; Esc restores. Same title control
  in the list and the editor.
- **List.** Title, relative "last updated" and "created", exact dates
  available (e.g. tooltip on a focusable `<time>`); the brief requires last
  updated. Newest first, no pagination. Built as a standalone
  `DocumentList` so it can move into a sidebar later. Cheeky empty state with
  the **Start typing** CTA.
- **Delete.** Row menu (Rename, Delete) in the list; "…" menu in the editor.
  Confirmation dialog naming the title and saying it is irreversible. From the
  editor, lands on `/app`.
- **Hero draft.** Seeds `/write` for visitors and logged-in users alike. The
  first save turns it into a document like any other, then the draft is
  removed from `localStorage`.
- **Save states.** Unsaved (changes, debounce pending) · Saving · Saved ·
  Warning (autosave failed, retried on next change or ⌘S) · Error (manual save
  failed). Warning/Error also show next to the counters so they are never
  hidden. `beforeunload` warns while anything is unsaved, reload included.
- **Two tabs.** An explicit save always wins; the overwriting tab gets Warning
  "Edited elsewhere too. This version won." (`overwrote: true`). Autosave from
  a stale revision is refused (409) and warns "Changed elsewhere. Reload, or
  save to overwrite." ([ADR-0008](../adr/0008-document-persistence.md)).
- **Chrome.** Blank page + cursor; everything else reachable, nothing removed.
  - Header mode, user-chosen in the header, kept per device: `on request`
    (default: starts hidden, hides on typing), `until typing` (starts shown,
    hides on typing), `always`. Revealed by the mouse at the top edge, Esc, or
    keyboard focus.
  - Header: back to `/app`, editable title (click → input, Enter/blur saves,
    Esc cancels), save status, Save button, toolbar toggle, header mode, "…"
    (Delete).
  - Toolbar: opened from the header, pinnable. Undo/redo, H1–H3, bold, italic,
    strike, inline code, link, bulleted/numbered lists, quote, code block, rule.
    Every button's tooltip shows its shortcut; every format has a shortcut or
    Markdown rule.
  - Counters (words, WPM) pinned by default, unpinnable. Reset restarts only
    the WPM clock (fixes the idle-page drag); words are the document's.
  - Pins persist per device in `localStorage`. Touch: header and toolbar
    always visible, sticky on top (docked to the keyboard → E8-02).
  - These are the intent; the UI agent may iterate on them.
- **Body font:** Hanken Grotesk ([DESIGN](../DESIGN.md#visual-line)).
- **Backend.** Hono `/documents` routes (list, create, get, save content,
  rename, delete) behind the session middleware; Next calls them from Server
  Components/Actions only. Zod on every input; content is ProseMirror JSON,
  ≤ 1 MB (413). Foreign document → 404 ([security notes](../security-notes.md)).

## Out of scope

Sidebar, sorting choice, folders, autosave hardening (backoff, local backup),
diff saves, "changed elsewhere" on focus if cut: all in the backlog (EX).

## Steps

1. [x] Grilling → `documents.feature`, `editor.feature`. `@negotiable` rules =
       step 6, deleted if cut.
2. [ ] **Next** (fresh session). Schema + migration (`documents`), use cases and Hono routes, Vitest for
       numbering, ownership 404, size limit, `overwrote`.
3. [ ] Steps, red (bdd-steps subagent, fresh session). `they reset the stats`
       moves from `landing.steps.ts` to common (now used by two features).
4. [ ] UI until green: list, empty state, `/write` create + manual save
       (button, ⌘S), states, rename, delete, hero draft.
5. [ ] Chromeless editor (E5-03): header modes and reveal, toolbar
       with shortcut tooltips, counters pin, touch.
6. [ ] **Cuttable if the block runs long:** autosave (idle debounce
       `AUTOSAVE_IDLE_MS = 1000`, flush on `visibilitychange` and navigation,
       Warning on failure); "changed elsewhere, reload?" on tab focus. If cut,
       the landing's autosave claims must be fixed ([E9-03](../BACKLOG.md#e9--demo-and-submission)).
7. [ ] `pnpm check` + e2e green, ARCHITECTURE/CONTEXT/DESIGN touched up, plan
       deleted.
