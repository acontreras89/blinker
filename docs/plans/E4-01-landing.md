# E4-01 Landing

Port [design/landing.html](../design/landing.html) to the app. The mockup is a
throwaway reference: behaviour below wins over it.

## Scope

- Tokens from [blinker.css](../design/blinker.css) into `globals.css` (shadcn
  names, light/dark by system preference, `--warning`, `--success`), Hanken via
  `next/font`.
- Marketing route group with every section of the mockup. CTAs go to `/signup`
  and `/login` (E2 owns those routes).
- Hero with a real Tiptap editor, shared with E5 (`src/components/editor/`):
  - Size by prop. Hero: display size, steps down to h2 past ~2 lines, grows
    until the fold, then scrolls inside following the cursor.
  - Stats: **words** = words in the document; **per minute** = words actually
    written (sum of increases) over writing time. Both values plus time are kept
    so either label can flip later.
  - Writing time starts at the first keystroke and runs only while the page is
    open.
  - Content and stats persist in `localStorage`; a control resets the stats only.
  - Nag line and counter pop (on, reduced motion locks it off) as in the mockup.
- Pricing built from a plan list (1..n; trial per plan; monthly, once, pro). A
  single plan shows a second joke card ("that's it"). Copy elsewhere that
  mentions the trial (hero fine print, FAQ) follows the list. Presets for every
  combination we played with; one constant picks the live one; a dev-only page
  renders all presets.

## Out of scope

- Hero draft becoming the first document after signup (E5-01).
- Meta/OG/favicon, 404/500, legal stubs (E4-02).
- Theme toggle (system preference only).

## Steps

1. [x] `e2e/features/landing.feature` + steps, red. Replaces the smoke feature.
2. [x] Tokens, font, route group, static sections.
3. [x] Pricing component + presets + dev preview.
4. [x] Editor component + stats + persistence; hero sizing.
5. [x] Green, `pnpm check`, visual pass light/dark/mobile.
6. [ ] User review; then close (delete plan, collapse task).
