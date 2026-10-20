import { Hono } from "hono";
import { auth } from "./auth";

// The backend: framework-agnostic, never imports next/* (ADR-0005).
export const app = new Hono()
  .get("/health", (c) => c.json({ status: "ok" as const }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export type AppType = typeof app;
