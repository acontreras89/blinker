import { createMiddleware } from "hono/factory";
import { auth } from ".";

export type User = { id: string; name: string };

// Re-reads the session from the DB on every call (ADR-0005): Server Actions are
// public POST endpoints, so the backend never trusts Next to have checked.
export const requireUser = createMiddleware<{ Variables: { user: User } }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "unauthorized" as const }, 401);
    c.set("user", { id: session.user.id, name: session.user.name });
    await next();
  },
);
