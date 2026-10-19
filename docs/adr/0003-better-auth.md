# 0003. Better Auth for email/password

Status: Accepted · 2026-10-19

## Context

Sessions must be server-validated. Hand-rolled auth is security-critical code we
cannot afford to own in an 8 h budget; Auth.js forces JWT with credentials.

## Decision

Better Auth with email/password and database sessions via its Drizzle adapter.
Its schema is adopted from day one with `usePlural: true`; all our tables are plural.

## Consequences

- Session cookie is httpOnly and checked against the DB on every protected request.
- OAuth (EX-03) becomes a provider config.
