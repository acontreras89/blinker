import { Hono } from "hono";

// The backend: framework-agnostic, never imports next/* (ADR-0005).
export const app = new Hono().get("/health", (c) =>
  c.json({ status: "ok" as const }),
);

export type AppType = typeof app;
