import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { auth } from "./auth";
import { billingRoutes, webhookRoutes } from "./billing/routes";
import { documentRoutes } from "./documents/routes";
import { e2eRoutes } from "./e2e";

// One line per backend call in `next dev`'s terminal. Not `hono/logger`: it
// reads `Date.now()`, which Next refuses while prerendering.
const devLog = createMiddleware(async (c, next) => {
  if (process.env.NODE_ENV !== "development") return next();
  const start = performance.now();
  await next();
  const ms = Math.round(performance.now() - start);
  console.log(`[api] ${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
});

// The backend: framework-agnostic, never imports next/* (ADR-0005).
export const app = new Hono()
  .use(devLog)
  .get("/health", (c) => c.json({ status: "ok" as const }))
  // Who the cookie belongs to, re-read from the DB on every call: a revoked
  // session is gone at once. Only what the UI needs leaves the backend.
  .get("/session", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const user = session && { id: session.user.id, name: session.user.name };
    return c.json({ user });
  })
  .route("/documents", documentRoutes)
  .route("/billing", billingRoutes)
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api/webhooks/stripe", webhookRoutes)
  .route("/api/e2e", e2eRoutes);

export type AppType = typeof app;
