# 0006. Own billing module with entitlements

Status: Accepted · 2026-10-19 · Amended by [0009](0009-sync-entitlements-from-stripe.md)

## Context

The write-up asks how we decide a user has access and what happens when the
webhook is late. Product wants subscriptions, a 7-day card-required trial
(max 3 documents) and a lifetime one-time purchase. Better Auth's Stripe plugin
covers subscriptions only.

## Decision

- Our own `billing` module, not the Better Auth plugin: Checkout Session,
  signature-verified idempotent webhook, and `getAccess(user)`.
- Access is modelled as entitlements (`subscription | trial | lifetime`),
  written only by webhooks (now: synced from Stripe, ADR-0009); `getAccess` returns the kind and its limits.
- E6 ships the subscription plus one of trial or lifetime; the rest are extras.

## Consequences

- One billing path for all payment kinds, visible to reviewers.
- Swapping to the plugin later is ~1–2 h behind `startCheckout` / `getAccess`.
