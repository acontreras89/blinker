# Architecture Decision Log

One ADR per decision in [`adr/`](adr/), numbered `NNNN-kebab-title.md`. Written
when the decision is made. Superseding an ADR: new ADR + mark the old one
`Superseded by NNNN`.

Template (keep it short):

```markdown
# NNNN. Title

Status: Accepted · YYYY-MM-DD

## Context

## Decision

## Consequences
```

| #    | Decision                                                                                         | Status   |
| ---- | ------------------------------------------------------------------------------------------------ | -------- |
| 0001 | [Local-only deployment](adr/0001-local-only-deployment.md)                                       | Accepted |
| 0002 | [SQLite with Drizzle](adr/0002-sqlite-drizzle.md)                                                | Accepted |
| 0003 | [Better Auth for email/password](adr/0003-better-auth.md)                                        | Accepted |
| 0004 | [playwright-bdd for acceptance tests](adr/0004-playwright-bdd.md)                                | Accepted |
| 0005 | [Next.js frontend, Hono backend in-process](adr/0005-next-frontend-hono-backend.md)              | Accepted |
| 0006 | [Own billing module with entitlements](adr/0006-own-billing-entitlements.md)                     | Accepted |
| 0007 | [Tiptap with Simple Editor, JSON storage](adr/0007-tiptap-json.md)                               | Accepted |
| 0008 | [Document persistence: short ids, full saves, last write wins](adr/0008-document-persistence.md) | Accepted |
