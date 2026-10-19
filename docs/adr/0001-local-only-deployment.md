# 0001. Local-only deployment

Status: Accepted · 2026-10-19

## Context

The brief accepts local/self-hosted delivery; cloud, if used, must be AWS or GCP.
Deploying costs time and adds public webhooks and secret management to an 8 h budget.

## Decision

Ship as a local app runnable from the README. Stripe webhooks reach it via the Stripe CLI.

## Consequences

- Reviewers run it themselves; the README must work on a fresh machine in <15 min.
- Deploying to GCP stays as an extra (EX-02).
