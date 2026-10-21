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
- **Document**: a titled rich text document owned by one subscriber.
