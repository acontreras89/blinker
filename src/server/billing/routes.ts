import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import Stripe from "stripe";
import { z } from "zod";
import { requireUser, type User } from "../auth/middleware";
import { getAccess, trialEligible } from "./access";
import {
  alreadyProcessed,
  confirmReturn,
  endTrial,
  portalUrl,
  startCheckout,
  syncSubscription,
} from "./use-cases";

const iso = (d: Date | null) => d?.toISOString() ?? null;

// The logged-in user's plan and the ways to change it.
export const billingRoutes = new Hono<{ Variables: { user: User } }>()
  .use(requireUser)
  // `had`: they ever subscribed, so the way back is "resubscribe".
  .get("/", (c) => {
    const userId = c.var.user.id;
    const access = getAccess(userId);
    const had = !trialEligible(userId);
    if (!access) return c.json({ access: null, had });
    const { status, trialEnd, periodEnd, cancelAt } = access.entitlement;
    return c.json({
      access: {
        status,
        trialEnd: iso(trialEnd),
        periodEnd: iso(periodEnd)!,
        cancelAt: iso(cancelAt),
        documentLimit: access.documentLimit,
      },
      had,
    });
  })
  .post("/checkout", async (c) => c.json(await startCheckout(c.var.user.id)))
  .post(
    "/return",
    zValidator("json", z.object({ sessionId: z.string().min(1) })),
    async (c) => {
      const status = await confirmReturn(
        c.var.user.id,
        c.req.valid("json").sessionId,
      );
      return c.json({ status });
    },
  )
  .post("/trial/end", async (c) => {
    if (!(await endTrial(c.var.user.id)))
      return c.json({ error: "not_trialing" as const }, 409);
    return c.json({ ended: true as const });
  })
  .post("/portal", async (c) => {
    const url = await portalUrl(c.var.user.id);
    if (!url) return c.json({ error: "no_customer" as const }, 409);
    return c.json({ url });
  });

// Every event we listen to just triggers a sync (stripe-notes).
const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

// Public: Stripe calls it. The signature is the only proof it came from Stripe.
export const webhookRoutes = new Hono().post("/", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "bad_signature" as const }, 400);
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(
      await c.req.text(),
      signature,
      secret,
    );
  } catch {
    return c.json({ error: "bad_signature" as const }, 400);
  }
  if (!HANDLED.has(event.type) || alreadyProcessed(event.id))
    return c.json({ received: true as const });
  const { customer } = event.data.object as {
    customer?: string | { id: string } | null;
  };
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return c.json({ received: true as const });
  // A throw here is a 500: Stripe retries the event later.
  await syncSubscription(customerId, { id: event.id, type: event.type });
  return c.json({ received: true as const });
});
