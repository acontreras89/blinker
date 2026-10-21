import "server-only";
import { hc } from "hono/client";
import { app, type AppType } from "@/server/app";

// In-process call: the backend has no public HTTP surface besides auth and the
// Stripe webhook (ADR-0005). The base URL is never resolved over the network.
export const api = hc<AppType>("http://backend.internal", {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    app.request(input, init),
});

// Public mounts only (`/api/auth/*`, `/api/webhooks/stripe`): Next route
// handlers pass the raw request through.
export const handle = (req: Request) => app.fetch(req);
