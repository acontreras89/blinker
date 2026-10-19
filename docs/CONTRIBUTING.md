# Contributing

## Code style

To be defined in E1 with the stack.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org), one-line subject, straight to `main`.
- Body only for what a reviewer reading the history would want: a security
  concern handled, a non-obvious constraint, a link to the ADR it produced.
  No implementation narration.
- Keep the Claude co-author trailers.
- Fixing an earlier commit of ours: `git commit --fixup <sha>` + autosquash rebase.
