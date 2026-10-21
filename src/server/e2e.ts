import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireUser, type User } from "./auth/middleware";
import { fakeBilling, fakeGateway } from "./billing/fake";
import { db } from "./db";
import { documentRoutes } from "./documents/routes";
import { users } from "./db/schema";
import { startCheckout } from "./billing/use-cases";
import { title } from "./documents/rules";
import { createDocument } from "./documents/use-cases";

// Test-only setup for e2e `Given`s: state the UI can't make, like backdated
// documents or what happens on Stripe's side. Off unless the e2e server sets
// E2E_SEED=on; every route then acts as the cookie's user only.
export const e2eRoutes = new Hono<{ Variables: { user: User } }>()
  .use(async (c, next) => {
    if (process.env.E2E_SEED !== "on") return c.notFound();
    await next();
  })
  .use(requireUser)
  .post(
    "/documents",
    zValidator(
      "json",
      z.object({
        title: title.min(1).optional(),
        text: z.string().optional(),
        createdAt: z.coerce.date().optional(),
        updatedAt: z.coerce.date().optional(),
      }),
    ),
    (c) => {
      const { text, ...seed } = c.req.valid("json");
      const paragraph = text
        ? { type: "paragraph", content: [{ type: "text", text }] }
        : { type: "paragraph" };
      const d = createDocument(
        c.var.user.id,
        { type: "doc", content: [paragraph] },
        seed,
      );
      return c.json({ id: d.id, title: d.title }, 201);
    },
  )
  // Billing: the fake Stripe lives in this process; steps drive it here and
  // tell the app with signed webhooks, as Stripe would.
  .post("/billing/checkout", async (c) =>
    c.json(await startCheckout(c.var.user.id)),
  )
  .post("/billing/checkout/:id/complete", async (c) => {
    const checkout = await fakeGateway.getCheckout(c.req.param("id"));
    const own = checkout && customerOf(c.var.user.id);
    if (!checkout || checkout.customerId !== own)
      return c.json({ error: "not_found" as const }, 404);
    const { subscription, successUrl } = fakeBilling.complete(checkout.id);
    return c.json({
      successUrl,
      customerId: subscription.customerId,
      subscription,
    });
  })
  .post(
    "/billing/subscription",
    zValidator(
      "json",
      z.object({
        status: z.string().optional(),
        trialEnd: z.coerce.date().nullable().optional(),
        periodEnd: z.coerce.date().optional(),
        cancelAt: z.coerce.date().nullable().optional(),
      }),
    ),
    async (c) => {
      const customerId = customerOf(c.var.user.id);
      const latest = customerId
        ? (await fakeBilling.subscriptions(customerId)).at(-1)
        : undefined;
      if (!latest) return c.json({ error: "not_found" as const }, 404);
      fakeBilling.update(latest.id, c.req.valid("json"));
      return c.json({ customerId: latest.customerId });
    },
  )
  // Calls the backend's document routes as the cookie's user, bypassing the
  // UI: proves the backend is the gate.
  .post(
    "/backend",
    zValidator(
      "json",
      z.object({
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
        path: z.string().regex(/^\/documents(\/|$)/),
        json: z.unknown().optional(),
      }),
    ),
    async (c) => {
      const { method, path, json } = c.req.valid("json");
      const res = await backend.request(path, {
        method,
        headers: {
          cookie: c.req.header("cookie") ?? "",
          "content-type": "application/json",
        },
        body: json === undefined ? undefined : JSON.stringify(json),
      });
      return c.json({ status: res.status });
    },
  );

const backend = new Hono().route("/documents", documentRoutes);

function customerOf(userId: string) {
  return db
    .select({ id: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .get()?.id;
}
