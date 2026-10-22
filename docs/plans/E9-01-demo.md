# E9-01 — Demo video

Grilled 2026-10-22. A Playwright run of [demo.feature](../../e2e/demo/demo.feature)
records the video; no hand recording.

## Scope

- One scenario composed from existing phrases; local ones only where missing
  (look around the landing, pay in real Checkout, try out the formatting).
- Real Stripe test mode, real webhooks: prod build on `:3000` with the
  user's `.env`, a fresh SQLite file, `stripe listen` in another terminal.
  `pnpm demo`; reviewers with a filled `.env` can run it too.
- Own config `playwright.demo.config.ts`: viewport and video 1280×720,
  `slowMo` 300, a typing delay (fixture option, 0 in the normal suite),
  longer pauses at key moments (pricing, Confirming payment, the draft
  in the editor). Target 2–4 min.
- Real Checkout: fill by label, brute force on its quirks (Link, iframes).
- `ffmpeg` WebM → H.264 MP4, 720p 30 fps, `docs/demo.mp4`; linked from
  WRITEUP. Inline player via GitHub upload at E9-02, optional.

## Out of scope

- Not a test of Stripe: the suite keeps the fake gateway.

## Steps

1. [x] Feature agreed with the user.
2. [x] Config, `pnpm demo` (port 3300, starts `stripe listen`), local steps;
       green, first take 1:13.
3. [x] Tuned over five takes (header links, FAQ, hesitation, shortcuts,
       fireworks, date tooltip, billing, dark theme): 1:54. User reviews.
4. [ ] `pnpm demo:video` → `docs/demo.mp4`; commit it, link from WRITEUP,
       close plan.
