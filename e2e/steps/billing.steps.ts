import { expect, type Page } from "@playwright/test";
import {
  Given,
  Then,
  When,
  callBackend,
  checkoutCopy,
  credentials,
  editor,
  expectAlert,
  expectInvitedToSubscribe,
  payCheckout,
  register,
  saveCopy,
  seedDocument,
  startCheckout,
  stripeEvent,
  stripePaths,
  subscribe,
  subscriptionStates,
  updateSubscription,
} from "./fixtures";

// User-facing copy, in the product's voice (docs/DESIGN.md#voice); control
// names stay plain. Save refusals live in `saveCopy` (fixtures.ts). E8-04
// polishes the copy.
const copy = {
  confirming: "Confirming payment…",
  unlocksLater:
    "Stripe hasn't confirmed yet. Writing unlocks the moment it does.",
  notTheirs:
    "Trying to impersonate someone else, huh? Stop messing around and subscribe to start typing!",
  pastDue: "Your last payment failed. Fix your card before Stripe gives up.",
  trialEnds: (day: string) => `Your trial ends on ${day}.`,
  renews: (day: string) => `Renews on ${day}.`,
  accessUntil: (day: string) => `Canceled. You can keep writing until ${day}.`,
  noSubscription: "You have no subscription. The cursor is waiting.",
  // Controls.
  dashboard: "Your documents",
  startPaying: "Start paying now",
  manageBilling: "Manage billing",
};

// Dates show as the day, `en-US` medium (`Oct 24, 2026`), like the dashboard's.
const day = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);

const control = (page: Page, name: string) =>
  page
    .getByRole("link", { name, exact: true })
    .or(page.getByRole("button", { name, exact: true }))
    .first();

const inCheckout = (url: URL) => url.pathname.startsWith(stripePaths.checkout);

// Leaving Checkout

When("they leave Checkout without paying", async ({ page }) => {
  await expect(page).toHaveURL(inCheckout);
  await page
    .getByRole("link", { name: checkoutCopy.back, exact: true })
    .click();
});

// Coming back from Checkout. The page clock is faked (time still flows) so
// the return page's ~10 s of retries can be skipped.

When(
  "they come back from Checkout before Stripe confirms the payment",
  async ({ page, billing }) => {
    const { id } = await startCheckout(page.request);
    billing.checkoutId = id;
    await page.clock.install();
    await page.goto(stripePaths.return(id!));
  },
);

Then("they are told the payment is being confirmed", async ({ page }) => {
  await expect(page.getByText(copy.confirming)).toBeVisible();
});

When("Stripe confirms the payment", async ({ page, billing }) => {
  const { customerId } = await payCheckout(page.request, billing.checkoutId!);
  billing.had = true;
  await stripeEvent(page.request, "checkout.session.completed", customerId);
});

When("Stripe stays silent for a while", async ({ page }) => {
  await expect(page.getByText(copy.confirming)).toBeVisible();
  // Each jump fires the next retry; the short real wait lets its call return.
  for (let i = 0; i < 8; i++) {
    await page.clock.fastForward(2_000);
    await page.waitForTimeout(250);
  }
});

Then(
  "they are told writing unlocks as soon as Stripe confirms",
  async ({ page }) => {
    await expect(page.getByText(copy.unlocksLater)).toBeVisible();
  },
);

Then("they are offered the dashboard", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: copy.dashboard, exact: true }),
  ).toBeVisible();
});

// THE OTHER USER'S CHECKOUT IS PAID ON PURPOSE: it proves the return checks
// whose payment it is, not only that one was made. (Their own unpaid
// Checkout is the late-confirmation case.)
When(
  /^they come back from (another user's paid Checkout|a Checkout that does not exist)$/,
  async ({ page, request }, checkout: string) => {
    let sessionId = "cs_fake_nobody";
    if (checkout.startsWith("another")) {
      await register(request, credentials());
      sessionId = (await startCheckout(request)).id!;
      await payCheckout(request, sessionId);
    }
    await page.goto(stripePaths.return(sessionId));
  },
);

Then("they are told the Checkout is not theirs", async ({ page }) => {
  await expectAlert(page, copy.notTheirs);
});

Then("they are no longer told the Checkout is not theirs", async ({ page }) => {
  await expect(page.getByText(copy.notTheirs)).toHaveCount(0);
});

// Without a subscription

Given(
  "Stripe reports their subscription is canceled",
  async ({ page, billing }) => {
    await updateSubscription(
      page.request,
      billing,
      subscriptionStates.canceled,
    );
  },
);

Then("they can read it but not edit it", async ({ page }) => {
  await expect(editor(page)).toBeVisible();
  await expect(editor(page)).not.toBeEditable();
});

// THE SERVER IS THE GATE: these bypass the UI on purpose.
const doc = (title: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: title }] }],
});

When(
  "they create a document through the server directly",
  async ({ page, server }) => {
    server.status = await callBackend(page.request, "POST", "/documents", {
      content: doc("A new document"),
    });
  },
);

When(
  /^they (edit|rename|read|delete) "(.*)" through the server directly$/,
  async ({ page, docs, server }, action: string, title: string) => {
    const path = `/documents/${docs.byTitle[title].id}`;
    const call = {
      edit: () =>
        callBackend(page.request, "PUT", `${path}/content`, {
          content: doc("edited"),
          revision: 1,
          mode: "manual",
        }),
      rename: () =>
        callBackend(page.request, "PATCH", path, { title: "Renamed" }),
      read: () => callBackend(page.request, "GET", path),
      delete: () => callBackend(page.request, "DELETE", path),
    }[action as "edit" | "rename" | "read" | "delete"];
    server.status = await call();
  },
);

Then(/^the server (refuses|allows)$/, async ({ server }, outcome: string) => {
  if (outcome === "refuses") expect(server.status).toBe(403);
  else expect(server.status).toBeGreaterThanOrEqual(200);
  if (outcome === "allows") expect(server.status).toBeLessThan(300);
});

Then(
  "they are told their subscription no longer lets them save",
  async ({ page }) => {
    await expectAlert(page, saveCopy.lapsed);
  },
);

// Subscription states

// "PAST DUE" AND "CANCELED, STILL IN THE PERIOD" CAN WRITE ON PURPOSE:
// Stripe is still retrying, or the user already paid for the period.
// Cannot write: the editor is not editable and they are invited back.
Then(/^they (can|cannot) write$/, async ({ page, billing }, can: string) => {
  if (can === "can") return expect(editor(page)).toBeEditable();
  await expectInvitedToSubscribe(page, billing);
  await expect(
    editor(page).and(page.locator('[contenteditable="true"]')),
  ).toHaveCount(0);
});

Then("they are told their last payment failed", async ({ page }) => {
  await expect(page.getByText(copy.pastDue)).toBeVisible();
});

// The trial

Then("Checkout offers them a 3-day trial", async ({ page }) => {
  await expect(page).toHaveURL(inCheckout);
  await expect(page.getByText(checkoutCopy.trialOffer)).toBeVisible();
});

Then("Checkout offers them no trial", async ({ page }) => {
  await expect(page).toHaveURL(inCheckout);
  await expect(
    page.getByRole("button", { name: checkoutCopy.pay, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(checkoutCopy.trialOffer)).toHaveCount(0);
});

Given(
  "a logged-in user on a trial with the documents {string}",
  async ({ page, user, billing, docs }, list: string) => {
    await register(page.request, user);
    await subscribe(page.request, billing, "trialing");
    for (const title of list.split(",").map((t) => t.trim()))
      docs.byTitle[title] = await seedDocument(page.request, { title });
    await page.goto("/app");
  },
);

Then("they are told their trial includes 1 document", async ({ page }) => {
  await expectAlert(page, saveCopy.trialLimit);
});

When("they start paying now", async ({ page }) => {
  await control(page, copy.startPaying).click();
});

// A SUBSCRIBER HAS NO BUTTON FOR THIS: the step asks the server directly.
When("they start a Checkout", async ({ page }) => {
  const { url, redirect } = await startCheckout(page.request);
  await page.goto((redirect ?? url)!);
});

// The billing page

Then("they are told when their trial ends", async ({ page, billing }) => {
  await expect(
    page.getByText(copy.trialEnds(day(billing.dates!.trialEnd!))),
  ).toBeVisible();
});

Then("they are told when it renews", async ({ page, billing }) => {
  await expect(
    page.getByText(copy.renews(day(billing.dates!.periodEnd!))),
  ).toBeVisible();
});

Then("they are told until when they have access", async ({ page, billing }) => {
  await expect(
    page.getByText(copy.accessUntil(day(billing.dates!.cancelAt!))),
  ).toBeVisible();
});

Then("they are told they have no subscription", async ({ page }) => {
  await expect(page.getByText(copy.noSubscription)).toBeVisible();
});

When("they manage billing", async ({ page }) => {
  await control(page, copy.manageBilling).click();
});

Then("they are in Stripe's billing portal", async ({ page }) => {
  await expect(page).toHaveURL((url) => url.pathname === stripePaths.portal);
});
