import { Hono } from "hono";
import { auth } from "./auth";
import { documentRoutes } from "./documents/routes";
import { e2eRoutes } from "./e2e";

// The backend: framework-agnostic, never imports next/* (ADR-0005).
export const app = new Hono()
  .get("/health", (c) => c.json({ status: "ok" as const }))
  // Who the cookie belongs to, re-read from the DB on every call: a revoked
  // session is gone at once. Only what the UI needs leaves the backend.
  .get("/session", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const user = session && { id: session.user.id, name: session.user.name };
    return c.json({ user });
  })
  .route("/documents", documentRoutes)
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api/e2e", e2eRoutes);

export type AppType = typeof app;
