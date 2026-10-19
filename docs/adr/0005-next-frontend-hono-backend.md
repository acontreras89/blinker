# 0005. Next.js frontend, Hono backend in-process

Status: Accepted · 2026-10-19

## Context

We want a backend independent of the frontend framework, without paying for a
second process (two servers, cookies across ports, more setup for reviewers).

## Decision

- Next.js (App Router) is the frontend: pages, Server Components, Server Actions.
- The backend is a Hono app in `src/server/` that never imports `next/*`.
  Inputs are validated with Zod (`@hono/zod-validator`).
- Next server code calls it in-process through Hono's typed client (`hc` with
  `app.request` as fetch). The browser never calls the backend directly.
- Only two routes are mounted publicly: `/api/auth/*` (Better Auth) and
  `/api/webhooks/stripe`.

## Consequences

- Server Actions are public POST endpoints anyway: session and access are
  checked in Hono middleware on every call, not trusted from Next.
- Splitting the backend into its own process = swap the client's fetch for HTTP.
