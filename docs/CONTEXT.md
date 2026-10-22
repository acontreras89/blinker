# Ubiquitous language

Provisional; sharpen as epics define each term.

- **Visitor**: anyone on the marketing site without a session.
- **User**: a registered account (email/password). Can log in; cannot create or edit documents.
- **Entitlement**: a paid right to use the app; one row per Stripe subscription
  (trial included) or one-time purchase.
- **Access**: what `getAccess(user)` derives from entitlements (kind + limits).
- **Subscriber**: a user whose subscription is `active` or `trialing`
  (`past_due` keeps it while Stripe retries; canceled keeps it until period end).
  Only subscribers create, edit or rename; any user reads and deletes their own.
  The backend refuses others with 403 (`no_access`, `trial_limit`).
- **Trial**: 3 days, 1 document (`TRIAL_DAYS`, `TRIAL_DOCUMENT_LIMIT`), once per
  user. "Start paying now" ends it early.
- **Upgrade path**: what a non-subscriber sees instead of writing: "Subscribe
  to start writing" (never paid) or "Resubscribe to keep writing" (lapsed),
  a read-only editor, refused saves that keep the text on screen.
- **Document**: a titled rich text document owned by one subscriber.
- **Save state**: Unsaved · Saving · Saved · Warning (autosave failed or the
  document changed elsewhere; retried on the next change or ⌘S) · Error (a
  manual save failed). Conflicts: [ADR-0008](adr/0008-document-persistence.md).
