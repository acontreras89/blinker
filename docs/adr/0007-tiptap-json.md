# 0007. Tiptap with Simple Editor, content stored as JSON

Status: Accepted · 2026-10-19

## Context

Compared Tiptap, Plate, Lexical, BlockNote, Milkdown. The product is a focused
writing tool, not a Notion-like block editor.

## Decision

Tiptap (ProseMirror) starting from its MIT Simple Editor template. Documents are
stored as ProseMirror JSON, validated server-side; never as HTML.

## Consequences

- No stored user HTML is ever rendered: no persistent XSS vector.
- Previews or exports need `generateHTML` on the server.
- Template components are not shadcn: styles are adapted by hand.
