import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app";
import { fakeBilling, fakeGateway } from "./fake";
import { TRIAL_DOCUMENT_LIMIT } from "./rules";

async function signUp() {
  const res = await app.request(
    "http://localhost:3000/api/auth/sign-up/email",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Ada",
        email: `${randomUUID()}@example.com`,
        password: "long enough",
      }),
    },
  );
  return res.headers.get("set-cookie")!.split(";")[0];
}

function as(cookie: string) {
  const call = (method: string, path: string, body?: unknown) =>
    app.request(`/billing${path}`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return {
    call,
    status: async () => (await (await call("GET", "")).json()).access,
    checkout: async () => await (await call("POST", "/checkout")).json(),
    confirm: async (sessionId: string) =>
      (await (await call("POST", "/return", { sessionId })).json()).status,
  };
}

const checkoutId = (url: string) => url.split("/").at(-1)!;

/** Starts Checkout and pays it on the fake: the user's ids. */
async function subscribe(user: ReturnType<typeof as>) {
  const { url } = await user.checkout();
  const id = checkoutId(url);
  const { customerId } = (await fakeGateway.getCheckout(id))!;
  const { subscription } = fakeBilling.complete(id);
  return { checkoutId: id, customerId: customerId!, subscription };
}

function webhook(event: object, secret = "whsec_test_secret") {
  const payload = JSON.stringify(event);
  return app.request("/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "stripe-signature": Stripe.webhooks.generateTestHeaderString({
        payload,
        secret,
      }),
    },
    body: payload,
  });
}

const subscriptionUpdated = (customer: string, id = `evt_${randomUUID()}`) => ({
  id,
  object: "event",
  type: "customer.subscription.updated",
  data: { object: { object: "subscription", customer } },
});

let ada: ReturnType<typeof as>;
beforeEach(async () => {
  ada = as(await signUp());
});

describe("checkout", () => {
  it("sends a new user to a Checkout with the trial", async () => {
    const { url } = await ada.checkout();
    expect(url).toMatch(/\/billing\/fake-checkout\/cs_fake_/);
    const { subscription } = fakeBilling.complete(checkoutId(url));
    expect(subscription.status).toBe("trialing");
  });

  it("reuses an open Checkout", async () => {
    const first = await ada.checkout();
    expect(await ada.checkout()).toEqual(first);
  });

  it("sends a user with access to billing instead", async () => {
    const { checkoutId } = await subscribe(ada);
    await ada.confirm(checkoutId);
    expect(await ada.checkout()).toEqual({ redirect: "/account/billing" });
  });

  it("offers the trial only once", async () => {
    const { customerId, subscription } = await subscribe(ada);
    fakeBilling.update(subscription.id, { status: "canceled" });
    await webhook(subscriptionUpdated(customerId));
    expect(await ada.status()).toBeNull();
    const again = await subscribe(ada);
    expect(again.subscription.status).toBe("active");
  });
});

describe("return from Checkout", () => {
  it("grants access once the session is paid, synced from the API", async () => {
    const { url } = await ada.checkout();
    const id = checkoutId(url);
    expect(await ada.confirm(id)).toBe("pending");
    fakeBilling.complete(id);
    expect(await ada.confirm(id)).toBe("ready");
    expect(await ada.status()).toMatchObject({
      status: "trialing",
      documentLimit: TRIAL_DOCUMENT_LIMIT,
    });
  });

  it("ignores another user's session", async () => {
    const { checkoutId } = await subscribe(ada);
    const eve = as(await signUp());
    await eve.checkout();
    expect(await eve.confirm(checkoutId)).toBe("invalid");
    expect(await eve.confirm("cs_unknown")).toBe("invalid");
    expect(await eve.status()).toBeNull();
  });
});

describe("webhook", () => {
  it("rejects a missing or wrong signature", async () => {
    const event = JSON.stringify(subscriptionUpdated("cus_x"));
    const unsigned = await app.request("/api/webhooks/stripe", {
      method: "POST",
      body: event,
    });
    expect(unsigned.status).toBe(400);
    const forged = await webhook(subscriptionUpdated("cus_x"), "whsec_other");
    expect(forged.status).toBe(400);
  });

  it("syncs the customer's subscriptions from Stripe", async () => {
    const { customerId } = await subscribe(ada);
    expect(await ada.status()).toBeNull();
    const res = await webhook(subscriptionUpdated(customerId));
    expect(res.status).toBe(200);
    expect(await ada.status()).toMatchObject({ status: "trialing" });
  });

  it("keeps access while past due and drops it when unpaid", async () => {
    const { customerId, subscription } = await subscribe(ada);
    fakeBilling.update(subscription.id, { status: "past_due" });
    await webhook(subscriptionUpdated(customerId));
    expect(await ada.status()).toMatchObject({ status: "past_due" });
    fakeBilling.update(subscription.id, { status: "unpaid" });
    await webhook(subscriptionUpdated(customerId));
    expect(await ada.status()).toBeNull();
  });

  it("treats a replayed event as a no-op", async () => {
    const { customerId, subscription } = await subscribe(ada);
    const event = subscriptionUpdated(customerId);
    await webhook(event);
    fakeBilling.update(subscription.id, { status: "canceled" });
    expect((await webhook(event)).status).toBe(200);
    expect(await ada.status()).toMatchObject({ status: "trialing" });
  });

  it("acknowledges events it doesn't handle or customers it doesn't know", async () => {
    const other = { ...subscriptionUpdated("cus_x"), type: "invoice.paid" };
    expect((await webhook(other)).status).toBe(200);
    expect((await webhook(subscriptionUpdated("cus_unknown"))).status).toBe(
      200,
    );
  });
});

describe("trial and portal", () => {
  it("ends the trial on request: unlimited from then on", async () => {
    const { checkoutId } = await subscribe(ada);
    await ada.confirm(checkoutId);
    expect((await ada.call("POST", "/trial/end")).status).toBe(200);
    expect(await ada.status()).toMatchObject({
      status: "active",
      documentLimit: null,
    });
    expect((await ada.call("POST", "/trial/end")).status).toBe(409);
  });

  it("opens the Portal for a customer only", async () => {
    expect((await ada.call("POST", "/portal")).status).toBe(409);
    await ada.checkout();
    const res = await ada.call("POST", "/portal");
    expect((await res.json()).url).toMatch(/\/billing\/fake-portal\?customer=/);
  });

  it("asks for a session", async () => {
    expect((await app.request("/billing")).status).toBe(401);
  });
});
