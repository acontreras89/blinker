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
2. [x] Backend: `documents` table, `src/server/documents/` (use cases,
       routes, Vitest), `src/lib/documents.ts` for Server Components/Actions.
       Contract for the next steps:
   - Seeding: `POST /api/e2e/documents` with the context's `request`
     (cookie) `{ title?, text?, createdAt?, updatedAt? }` → `{ id, title }`.
     Test-only, on via `E2E_SEED=on` in `playwright.config.ts`.
   - "Saving fails" has no backend switch: fail the Server Action POST in the
     page (`page.route`, requests with a `next-action` header).
   - Save outcomes (`saveContent`): `saved` (+ `overwrote`), `conflict`
     (autosave only), `missing`, `too_large`, `failed`. Title rules:
     `TITLE_MAX` and `title` in `@/server/documents/rules`.
3. [x] Steps, red: `common`, `documents`, `editor` steps. Contract for the
       UI (the steps are the source of truth; copy in their `copy` objects
       and `saveCopy` in `fixtures.ts`):
   - **List.** A document is a link to `/write/[id]` named exactly its title,
     in a list item (or row) that also holds its dates as text `Updated 2
hours ago` / `Created 3 days ago`. Each relative date, focused, has the
     exact date (`Oct 18, 2026`-style day, `en-US` medium) in its accessible
     description. Row actions: a `More options` button opening menu items
     `Rename`, `Delete` (or those as buttons in the row). Empty state text
     `Nothing here yet.` plus a `Start typing` link.
   - **Title.** A textbox named `Title` (in the row or the header); Enter
     confirms, Escape cancels; too long → its accessible error message. In
     the editor the title is a button named by the title (or the `Title`
     field itself).
   - **Delete.** A `dialog`/`alertdialog` with the title and the
     "gone for good" copy; `Cancel` and `Delete` buttons.
   - **Saves.** Unsaved and Saved are `status` elements whose whole text is
     the copy (present in the accessibility tree, not necessarily visible).
     Failed, warned, overwrote and changed-elsewhere are visible `alert`s.
     ⌘/Ctrl+S saves; `beforeunload` while unsaved. Stale tab on focus: the
     changed-elsewhere alert plus a `Reload` button.
   - **Chrome.** The header is shown ⇔ a `Save` button is visible; Escape
     reveals it (steps use that to reach header controls). The "…" menu is
     `More options` → menu item `Delete`. Header mode: a `Show header`
     button/combobox, options (`radio`/`menuitemradio`/`option`) `On
request`, `Until typing`, `Always`. Toolbar: role `toolbar` named
     `Formatting`, toggled by a `Toolbar` button, pinned with `Pin toolbar`.
     Counters unpinned with `Unpin counters` (or a pressed `Pin counters`).
     "Only the text and the counters": no visible link, no Save, no toolbar.
     Touch = CDP touch emulation (`pointer: coarse`, `hover: none`).
   - **Formats.** Tiptap's default shortcuts plus ⌘K for links (the shortcut
     focuses a URL field; Enter applies). Checked by role (`strong`,
     `emphasis`, `code`, `blockquote`, `heading`, `separator`, `link`),
     strike by `line-through`, lists by `list-style-type` (disc/circle/square
     vs decimal), code block as `code` inside `pre`. ` ```let x ` must give a
     code block with text `let x` (Tiptap's default rule would take `let` as
     the language). Each toolbar button (named by its format, plus Undo,
     Redo, Link, Horizontal rule) has its shortcut in its accessible
     description on hover (`⌘`/`Ctrl`, `⇧`/`Shift`, `⌥`/`Alt` + key; the
     rule shows `---`).
   - **Time.** Editor `Given`s install Playwright's clock (time flows);
     idle minutes are `clock.fastForward`. `they pause` waits 1.5 s.
     Returning to a tab = `bringToFront` + a window `focus` event.
4. [x] UI until green: list, empty state, `/write` create + manual save
       (button, ⌘S), states, rename, delete, hero draft.
5. [x] Chromeless editor (E5-03): header modes and reveal, toolbar
       with shortcut tooltips, counters pin, touch.
6. [x] Autosave (idle debounce `AUTOSAVE_IDLE_MS = 1000`, flush on
       `visibilitychange`/`pagehide` and the back link, Warning on failure);
       "changed elsewhere, reload?" on tab focus. Kept, not cut. UI
       decisions, for step 7 to move:
   - Save logic in `use-saver.ts`: one save at a time, the next queued
     (manual wins). Autosave skips while "changed elsewhere" is up; ⌘S
     overwrites. Focus/visible → `revisionOf` server action; newer → alert
     with Reload. Hero draft loads as Unsaved, no autosave until a change.
   - Chrome: fixed top stack (header, then toolbar), hidden with the
     `hidden` attribute. Pointer reveal at ≤ 12 px from the top, hides again 80 px below
     unless focus/menu inside. Unpinned toolbar and counters follow the
     header. Save problems sit above the counters, always visible. Content
     top padding fits header + toolbar, so revealing covers no text.
   - Prefs in `localStorage` (`blinker:header|toolbar|counters`).
   - Shortcut hints: `⌘⇧⌥` on Apple, `Ctrl+Shift+Alt` elsewhere; tooltip is
     visual only, the hint is each button's `aria-describedby`.
   - Shared editor fixes (hero too): ` ``` ` opens a code block at once (no
     language); an arrow after ⌘A collapses the "all" selection (formats
     applied to nothing in an empty doc, typing replaced the text); ⌘K
     dispatches an event the page claims; StarterKit underline off, links
     don't open on click; list markers and code/pre/hr/link styles.
   - Style guide gaps filled: code in the system monospace stack; document
     body 1.65 line height, h1 2.2em / h2 1.55em / h3 1.2em.
   - Contract changes (steps, locate/wait only): list format check located
     the item from the editor inside the list (`has` is relative), so it
     never matched; editor `Given`s wait for the editor before acting (an
     immediate Escape landed before hydration).
   - Follow-ups: counter pop toggle in the editor (DESIGN says off with a
     toggle; not built); the toolbar has no overflow hint on phones.
7. [ ] `pnpm check` + e2e green, ARCHITECTURE/CONTEXT/DESIGN touched up, plan
       deleted.
