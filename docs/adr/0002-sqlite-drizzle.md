# 0002. SQLite with Drizzle

Status: Accepted · 2026-10-19

## Context

Reviewers must run the app on a fresh machine in <15 min ([ADR-0001](0001-local-only-deployment.md)).
The brief allows SQLite.

## Decision

SQLite (single file) through Drizzle ORM; migrations as SQL files in the repo.
Documents and their versions are stored in the database, not as files on disk.

## Consequences

- No Docker or DB server as a prerequisite.
- One store gives transactions, ownership checks and "last updated" listings as plain queries.
- Moving to Postgres later means a new Drizzle dialect and regenerated migrations.
