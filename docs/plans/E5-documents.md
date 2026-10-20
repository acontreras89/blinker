# E5 Documents and editor

Covers E5-01..03: list, create, edit, save, rename, delete, chromeless editor.
Any logged-in user for now; E6 plugs `getAccess` into the same middleware.
Persistence model: [ADR-0008](../adr/0008-document-persistence.md).

**Prerequisite:** E2-01 green (it owns `/app`, `/write` and the hero draft
seeding). Step 1 may run before that; it only adds new files.

## Decisions

- **Routes.** `/app` lists documents; `/write` is a blank editor, the document
  is created on its first save and the URL becomes `/write/[id]` (replace, no
  reload). `/write/[id]` renders server-side with its content; unknown or
  foreign id → the 404 page.
- **Titles.** Server assigns `Untitled`, `Untitled (2)`… on create, numbered
  among the user's documents. Rename: trimmed, ≤ 100, empty restores the
  previous title, duplicates allowed (identity is the id). Rename also bumps
  `updatedAt`.
- **List.** Title + relative "last updated", absolute date in a tooltip on a
  focusable `<time>`. Newest first, no pagination. Built as a standalone
  `DocumentList` so it can move into a sidebar later. Cheeky empty state with
  the **Start typing** CTA.
- **Delete.** Row menu (Rename, Delete) in the list; "…" menu in the editor.
  Confirmation dialog naming the title and saying it is irreversible. From the
  editor, lands on `/app`.
- **Hero draft.** The first save turns it into a document like any other, then
  the draft is removed from `localStorage`. Its scenario: check
  `auth.feature` first and extend it rather than duplicate.
- **Save states.** Unsaved (changes, debounce pending) · Saving · Saved ·
  Warning (autosave failed, retried on next change or ⌘S) · Error (manual save
  failed). Warning/Error also show next to the counters so they are never
  hidden. `beforeunload` warns while anything is unsaved, reload included.
- **Two tabs.** Last write wins, but the overwriting tab gets Warning
  "Edited elsewhere too. This version won." (`overwrote: true`).
- **Chrome.** Blank page + cursor; everything else reachable, nothing removed.
  - `CHROME = "hidden" | "hide-on-type"` constant, default `hidden`: header
    starts hidden (or visible until the first keystroke). Revealed by the mouse
    at the top edge, Esc, or keyboard focus; a pin keeps it. Maybe a header
    button to switch modes.
  - Header: back to `/app`, editable title (click → input, Enter/blur saves,
    Esc cancels), save status, Save button, toolbar toggle, pin, "…" (Delete).
  - Toolbar: opened from the header, pinnable. Undo/redo, H1–H3, bold, italic,
    strike, inline code, link, lists, quote, code block, rule. Every button's
    tooltip shows its shortcut; every format has a shortcut or Markdown rule.
  - Counters (words, WPM) pinned by default, unpinnable.
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

1. [ ] `/bdd-feature` → `e2e/features/documents.feature` (own work block).
2. [ ] Schema + migration (`documents`), use cases and Hono routes, Vitest for
       numbering, ownership 404, size limit, `overwrote`.
3. [ ] Steps, red (bdd-steps subagent).
4. [ ] UI until green: list, empty state, `/write` create + manual save
       (button, ⌘S), states, rename, delete, hero draft.
5. [ ] Chromeless editor (E5-03): `CHROME` modes, header reveal/pin, toolbar
       subset with shortcut tooltips, counters pin, touch.
6. [ ] **Cuttable if the block runs long:** autosave (idle debounce
       `AUTOSAVE_IDLE_MS = 1000`, flush on `visibilitychange` and navigation,
       Warning on failure); "changed elsewhere, reload?" on tab focus. If cut,
       the landing's autosave claims must be fixed ([E9-03](../BACKLOG.md#e9--demo-and-submission)).
7. [ ] `pnpm check` + e2e green, ARCHITECTURE/CONTEXT/DESIGN touched up, plan
       deleted.
