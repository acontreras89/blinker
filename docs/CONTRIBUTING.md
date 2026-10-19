# Contributing

## Code style

- ESLint (`eslint-config-next`) + Prettier. `pnpm check` = format check, lint,
  typecheck, unit tests; `pnpm test:e2e` = acceptance features.
- Boundaries between `src/server` and the frontend are enforced by ESLint
  ([ARCHITECTURE](ARCHITECTURE.md#invariants)).

## Dependencies

- pnpm only.
- Always install the latest stable (`pnpm add x@latest`, `shadcn@latest`);
  check the version before installing, never trust a remembered one.
  Exception: majors the framework pins (TypeScript 5, ESLint 9 for Next 16).
- Node: the LTS in `.nvmrc` (`nvm use`).
- UI primitives come from shadcn/ui.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org), one-line subject, straight to `main`.
- Body only for what a reviewer reading the history would want: a security
  concern handled, a non-obvious constraint, a link to the ADR it produced.
  No implementation narration.
- Keep the Claude co-author trailers.
- Fixing an earlier commit of ours: `git commit --fixup <sha>` + autosquash rebase.
