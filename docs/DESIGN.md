# Design

Product and brand concept. Tokens and components: [design/styleguide.html](design/styleguide.html)
(source: [design/blinker.css](design/blinker.css)); applied: [design/landing.html](design/landing.html).
Open them through any static server (`npx serve docs`).

## Product

**Blinker**: a focused rich text editor for professionals who should be writing
and procrastinate instead. Power-user minded: opinionated, few features, done well.

- Chromeless by default: a blank page and a cursor. Keyboard shortcuts (⌘B/I/K)
  and Markdown input rules (`#`, `-`, `>`); toolbar only on request. On touch
  devices (no shortcuts) header, toolbar and counters stay on screen.
- Editor header mode, per device: `On request` (default), `Until typing`,
  `Always`; revealed by the top edge, Esc or focus, kept while hovered or
  keyboard-focused. Counters: revealed by the bottom edge. Toolbar and
  counters are pinnable per device (not on touch).
- Autosave plus manual save (⌘S, button), with a quiet status: Unsaved, Saving,
  Saved; a warning while autosave retries, an error when a manual save fails.
  Never hidden when work is at risk.
- Live stats: words in the document, and words per minute over the words
  actually written (deleting never lowers your speed).
- Not included, on purpose: AI, collaboration, export.
- Pricing: Monthly $8 with a 7-day card-required trial capped at 3 documents;
  Lifetime $9,600 once (100 years of Monthly). Billing model: [ADR-0006](adr/0006-own-billing-entitlements.md).

## Voice

Cheeky, impatient, a bit insolent: the cursor is judging you. Tagline: **The
cursor is waiting.** (runners-up: _Stop reading. Start typing._, _Start
typing._). Primary CTA is always **Start typing**.

- Jokes live in marketing and mouse-driven moments: empty states, save feedback,
  sidebar. **Never while typing**: then only the counter speaks.
- Errors say what happened and what's next, in the product's voice; no apologies,
  no emoji.
- Placeholder social proof must read as obviously fake.

## Visual line

Neutral and quiet, so the page is the only thing that matters.

- Black and white, light and dark from day one: the system's, unless the
  reader picks one (per device). One accent, magenta, reserved for
  the cursor, the primary CTA, focus and the counter pop. Status colours
  (success, warning, destructive) mark state only.
- The brand mark is the blinking cursor after the wordmark. Every cursor on a
  page blinks in step.
- Type: Hanken Grotesk, one family, document body included (1.65 line height;
  h1 2.2em, h2 1.55em, h3 1.2em). Code: the system monospace stack.
- Code blocks are highlighted in black and white: weight and shade only.
- Tokens use shadcn/ui names so they map 1:1 onto `src/app/globals.css`.

## Motion

- Only the cursor blink and the counter pop move on their own; anything else
  answers a user action (bars slide in and out, 200 ms).
- Counter pop: on in the landing; off by default in the editor, with a toggle.
- **`prefers-reduced-motion` always wins**: no blink, no pop, toggle disabled with
  the reason shown. Not overridable.
