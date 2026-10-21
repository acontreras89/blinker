# Rich text editor — take-home assignment

Work in progress. Sections below are filled in E7.

- Setup (see [Stripe setup](#stripe-setup) below)
- Architecture overview → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Tradeoffs and what's next
- Stripe test flow (see [Stripe setup](#stripe-setup) below)
- Known limitations
- Write-up
- Demo
- How AI was used → [AGENTS.md](AGENTS.md), [time and token log](docs/WORKLOG.md)

## Stripe setup

Test mode only; no real money moves. You need a free Stripe account.

1. Install the Stripe CLI: `brew install stripe/stripe-cli/stripe` (other
   platforms: [docs](https://docs.stripe.com/stripe-cli)), then `stripe login`.
2. In the Dashboard, switch to test mode (or a sandbox) → Developers → API
   keys. Copy the secret key (`sk_test_…`) into `.env` as `STRIPE_SECRET_KEY`.
3. `stripe listen --print-secret` → copy the `whsec_…` into `.env` as
   `STRIPE_WEBHOOK_SECRET`. It is stable per machine and account.
4. `pnpm stripe:setup` creates the product and prices in your test account;
   safe to re-run. _(Lands in E6.)_
5. While the app runs, keep webhooks forwarded in another terminal:
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Test cards (any future date, any CVC, any postcode):

| Card                  | Result                                       |
| --------------------- | -------------------------------------------- |
| `4242 4242 4242 4242` | Paid                                         |
| `4000 0000 0000 0002` | Declined                                     |
| `4000 0025 0000 3155` | Asks for 3D Secure                           |
| `4000 0000 0000 0341` | Saved, but charges fail (renewal → past due) |
