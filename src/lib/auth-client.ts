import { createAuthClient } from "better-auth/react";

// Browser side of Better Auth: talks to the public `/api/auth/*` mount only
// (docs/security-notes.md).
export const authClient = createAuthClient();
