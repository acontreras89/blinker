# 0008. Document persistence: short ids, full saves, last write wins

Status: Accepted · 2026-10-20

## Context

One writer per document, no collaboration (out of scope in the brief). We still
want readable URLs, a cheap save path and a warning when two tabs fight.

## Decision

- Ids: nanoid, 8 chars, base62 (~47.6 bits). Not secrets: ownership is checked
  on every request. Primary key collision → retry.
- Every save sends the whole ProseMirror JSON (≤ 1 MB, roughly 100k+ words).
- Each document has an integer `revision`. A save carries the revision it was
  based on; the server always writes (last write wins) and answers
  `overwrote: true` when that base was stale, so the client can warn.
- Titles are labels, not identity: duplicates are allowed. Blob storage, if
  ever used, would key by id and apply the title only on download.

## Consequences

- No merge logic; a stale tab silently wins, only with a warning.
- Saves grow with the document; diffs (ProseMirror steps) are a later option.
