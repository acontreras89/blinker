# Security notes

Running cheat sheet for the E7-02 write-up. One line per decision, link the code.

- **No open redirect after login.** `next` is accepted only if it is a known
  private route (today `/app`, `/write`); anything else, including absolute and
  protocol-relative URLs, falls back to `/app`.
- **No account enumeration on login.** Wrong password and unknown email return
  the same message.
- **Password rules on signup only.** Login never re-validates length, so
  tightening the rule cannot lock out existing users.
- **Server-side sessions.** httpOnly cookie checked against the DB on every
  request ([ADR-0003](adr/0003-better-auth.md)); logout revokes only the current
  session, other devices stay logged in.
- **Default auth rate limit.** Better Auth's built-in limiter is on in
  production; only e2e turns it off (`AUTH_RATE_LIMIT=off`).
- **Foreign documents are 404, not 403.** Ownership is checked on every
  document request; another user's id answers like a missing one, so ids can't
  be probed. Short ids are not secrets ([ADR-0008](adr/0008-document-persistence.md)).
