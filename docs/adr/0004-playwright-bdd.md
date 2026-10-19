# 0004. playwright-bdd for acceptance tests

Status: Accepted · 2026-10-19

## Context

UI behaviour is specified in Gherkin before it is built ([AGENTS.md](../../AGENTS.md#feature-flow-bdd--provisional)).

## Decision

playwright-bdd: `.feature` files compile to Playwright tests and run on the Playwright runner.

## Consequences

- Fixtures, traces and slow-mo (for the E9 demo) come from Playwright for free.
- Steps are Playwright code, not a separate Cucumber world.
