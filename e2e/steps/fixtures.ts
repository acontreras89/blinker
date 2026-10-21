import { createHmac, randomUUID } from "node:crypto";
import {
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Cookie,
  type Page,
} from "@playwright/test";
import { createBdd, test as base } from "playwright-bdd";

// Shared state and helpers for every steps file. Steps locate by accessible
// role and name only; the UI is free to render them however it likes.

export type Credentials = { name: string; email: string; password: string };

/** A document a step made through the API. */
export type Seeded = {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type Fixtures = {
  /** The scenario's user: fresh credentials, registered only if a step does. */
  user: Credentials;
  /** The cookies of the session a step logged in with, to replay later. */
  session: { cookies: Cookie[] };
  /** The user's second device: a separate browser context. */
  secondDevice: Page;
  /** A second tab of the scenario's browser: same context, same session. */
  secondTab: Page;
  /** Documents seeded by `Given`s: the user's by title, the one being edited, another user's. */
  docs: { byTitle: Record<string, Seeded>; current?: Seeded; other?: string };
  /** Whether Server Action POSTs (saves) are failed in the page. */
  saving: { fails: boolean };
  /** Browser dialogs the page raised, by type (`beforeunload`…). */
  dialogs: string[];
  /** Words per minute read before a change, to compare after it. */
  speed: { beforeIdle?: number; beforeReset?: number };
  /** The user's subscription as the steps set it up in the fake Stripe. */
  billing: Billing;
  /** The status of the last call a step made to the server directly. */
  server: { status?: number };
};

export type Billing = {
  /** Whether they ever had a subscription: lapsed users are invited back. */
  had: boolean;
  customerId?: string;
  /** The Checkout a step started and left open. */
  checkoutId?: string;
  /** The dates of their subscription, to read them back in the UI. */
  dates?: SubscriptionPatch;
};

export const test = base.extend<Fixtures>({
  // `provide` is Playwright's `use`, renamed so the React hooks lint keeps quiet.
  user: async ({}, provide) => provide(credentials()),
  session: async ({}, provide) => provide({ cookies: [] }),
  secondDevice: async ({ browser }, provide) => {
    const context = await browser.newContext();
    await provide(await context.newPage());
    await context.close();
  },
  secondTab: async ({ page }, provide) => {
    const tab = await page.context().newPage();
    await provide(tab);
    await tab.close();
  },
  docs: async ({}, provide) => provide({ byTitle: {} }),
  saving: async ({}, provide) => provide({ fails: false }),
  dialogs: async ({}, provide) => provide([]),
  speed: async ({}, provide) => provide({}),
  billing: async ({}, provide) => provide({ had: false }),
  server: async ({}, provide) => provide({}),
});

export const { Given, When, Then } = createBdd(test);

/** Unique per call: each scenario runs against one shared database. */
export function credentials(): Credentials {
  return {
    name: "Ada",
    email: `user-${randomUUID()}@example.com`,
    password: "long enough password",
  };
}

// Setup goes through the API: a Given prepares state, it does not test the UI.
// A standalone request context registers without logging the browser in; a
// context's own `request` shares its cookies, so it logs that browser in.
export async function register(api: APIRequestContext, user: Credentials) {
  const res = await api.post("/api/auth/sign-up/email", { data: user });
  expect(res.ok(), await res.text()).toBe(true);
}

export async function logIn(context: BrowserContext, user: Credentials) {
  const res = await context.request.post("/api/auth/sign-in/email", {
    data: { email: user.email, password: user.password },
  });
  expect(res.ok(), await res.text()).toBe(true);
}

/**
 * Seeds a document as the request's user (`POST /api/e2e/documents`, on only in
 * e2e). A context's own `request` seeds for the browser's user.
 */
export async function seedDocument(
  api: APIRequestContext,
  seed: {
    title?: string;
    text?: string;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
): Promise<Seeded> {
  const res = await api.post("/api/e2e/documents", { data: seed });
  expect(res.status(), await res.text()).toBe(201);
  const { id, title } = await res.json();
  return { id, title, createdAt: seed.createdAt, updatedAt: seed.updatedAt };
}

export const documentPath = (id: string) => `/write/${id}`;

// The editor on screen: the landing hero or the app editor.
export const editor = (page: Page) =>
  page.getByRole("textbox").and(page.locator("[contenteditable]"));

/**
 * Whether a browser context holds a live session, judged by what the landing
 * offers it. Checked in a new tab so the scenario's page stays where it is.
 */
export async function expectLoggedIn(context: BrowserContext, loggedIn = true) {
  const tab = await context.newPage();
  await tab.goto("/");
  const openApp = tab.getByRole("link", { name: "Open app", exact: true });
  const logIn = tab.getByRole("link", { name: "Log in", exact: true });
  await expect(loggedIn ? openApp : logIn).toBeVisible();
  await expect(loggedIn ? logIn : openApp).toHaveCount(0);
  await tab.close();
}

/** Puts the caret at the end of the editor's text, as a click there would. */
export async function focusEditorEnd(page: Page) {
  await editor(page).click();
  await editor(page).press("ControlOrMeta+a");
  await editor(page).press("ArrowRight");
}

// Save state, in the product's voice (docs/DESIGN.md#voice). Unsaved and
// Saved are polite statuses: announced, not necessarily on screen while the
// header is hidden. Everything else is an alert that must be visible
// (docs/CONTEXT.md, "Save state"; ADR-0008 for two tabs).
export const saveCopy = {
  unsaved: "Unsaved changes",
  saved: "Saved",
  failed: "Not saved. The server blinked first. Save again.",
  warned: "Not saved yet. Trying again on your next change.",
  overwrote: "Edited elsewhere too. This version won.",
  changedElsewhere: "Changed elsewhere. Reload, or save to overwrite.",
  // Billing (docs/plans/E6-billing.md): the server refused the save.
  lapsed: "Not saved: your subscription has ended. Your text stays right here.",
  trialLimit: "Your trial includes 1 document.",
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A `status` whose whole text is the copy (counters are `output`s, also statuses). */
export const saveStatus = (page: Page, copy: string) =>
  page
    .getByRole("status")
    .filter({ hasText: new RegExp(`^\\s*${escape(copy)}\\s*$`) });

export async function expectSaveStatus(page: Page, copy: string) {
  await expect(saveStatus(page, copy).first()).toBeAttached();
}

const saveAlert = (page: Page) =>
  page.getByRole("alert").filter({
    hasText: new RegExp(
      [
        saveCopy.failed,
        saveCopy.warned,
        saveCopy.overwrote,
        saveCopy.changedElsewhere,
        saveCopy.lapsed,
        saveCopy.trialLimit,
      ]
        .map(escape)
        .join("|"),
    ),
  });

/**
 * Saves (with the keyboard shortcut unless told how) and waits until the save
 * has an outcome: Saved, or one of the save alerts.
 */
export async function save(page: Page, how?: () => Promise<void>) {
  await (how ? how() : editor(page).press("ControlOrMeta+s"));
  await expect(
    saveStatus(page, saveCopy.saved).or(saveAlert(page)).first(),
  ).toBeAttached();
}

export async function expectAskedToLogIn(page: Page) {
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
}

export async function fillLogIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

export async function fillSignUp(page: Page, user: Credentials) {
  await page.getByLabel("Name", { exact: true }).fill(user.name);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
}

// Feedback: a field's error must be tied to the field; a form-wide one must be
// announced. Where and how it shows is up to the UI.
export async function expectFieldError(
  page: Page,
  field: string,
  copy: string,
) {
  await expect(
    page.getByLabel(field, { exact: true }),
  ).toHaveAccessibleErrorMessage(copy);
}

export async function expectAlert(page: Page, copy: string) {
  await expect(page.getByRole("alert").filter({ hasText: copy })).toBeVisible();
}

// Billing. Stripe is a fake in e2e (`BILLING_GATEWAY=fake`); its state lives
// in the server, so steps drive it through test-only routes
// (`/api/e2e/billing/*`, as the context's user) and tell the app about changes
// with webhooks signed with the e2e secret, as Stripe would.

// The upgrade path's call to action (docs/plans/E6-billing.md), in the
// product's voice; E8-04 polishes it. Never paid → subscribe; lapsed → back.
export const ctaCopy = {
  subscribe: "Subscribe to start writing",
  resubscribe: "Resubscribe to keep writing",
};

// The fake Checkout, worded as Stripe's.
export const checkoutCopy = {
  pay: "Subscribe",
  trialOffer: "3 days free",
  back: "Back",
};

/** The visible invitation to subscribe: a link or a button. */
export async function expectInvitedToSubscribe(page: Page, billing: Billing) {
  const name = billing.had ? ctaCopy.resubscribe : ctaCopy.subscribe;
  await expect(
    page
      .getByRole("link", { name, exact: true })
      .or(page.getByRole("button", { name, exact: true }))
      .first(),
  ).toBeVisible();
}

/** Where the fake Stripe's hosted pages live (docs/plans/E6-billing.md). */
export const stripePaths = {
  checkout: "/billing/fake-checkout/",
  portal: "/billing/fake-portal",
  return: (sessionId: string) =>
    `/billing/return?session_id=${encodeURIComponent(sessionId)}`,
};

export type SubscriptionPatch = {
  status?: string;
  trialEnd?: Date | null;
  periodEnd?: Date;
  cancelAt?: Date | null;
};

const DAY = 24 * 60 * 60 * 1000;
const fromNow = (days: number) => new Date(Date.now() + days * DAY);

// Each state as Stripe would report it. "Past it" keeps an active status on
// purpose: access must end at `cancelAt` even if no final event arrives.
export const subscriptionStates = {
  trialing: {},
  active: { status: "active", trialEnd: null, periodEnd: fromNow(30) },
  "past due": { status: "past_due", trialEnd: null, periodEnd: fromNow(2) },
  "canceled at period end, still in it": {
    status: "active",
    trialEnd: null,
    periodEnd: fromNow(10),
    cancelAt: fromNow(10),
  },
  "canceled at period end, past it": {
    status: "active",
    trialEnd: null,
    periodEnd: fromNow(-1),
    cancelAt: fromNow(-1),
  },
  canceled: { status: "canceled", trialEnd: null, periodEnd: fromNow(-1) },
  unpaid: { status: "unpaid", trialEnd: null, periodEnd: fromNow(-5) },
  incomplete: { status: "incomplete", trialEnd: null, periodEnd: fromNow(1) },
} satisfies Record<string, SubscriptionPatch | Record<string, never>>;
export type SubscriptionState = keyof typeof subscriptionStates;

const WEBHOOK_SECRET = "whsec_e2e_secret";

/** Posts a webhook to the app, signed the way Stripe signs them. */
export async function stripeEvent(
  api: APIRequestContext,
  type: string,
  customerId: string,
) {
  const payload = JSON.stringify({
    id: `evt_e2e_${randomUUID()}`,
    object: "event",
    type,
    data: { object: { customer: customerId } },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", WEBHOOK_SECRET)
    .update(`${t}.${payload}`)
    .digest("hex");
  const res = await api.post("/api/webhooks/stripe", {
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${t},v1=${v1}`,
    },
    data: payload,
  });
  expect(res.ok(), await res.text()).toBe(true);
}

/** Starts a Checkout as the request's user: its URL, or where they go instead. */
export async function startCheckout(
  api: APIRequestContext,
): Promise<{ url?: string; redirect?: string; id?: string }> {
  const res = await api.post("/api/e2e/billing/checkout");
  expect(res.ok(), await res.text()).toBe(true);
  const body: { url?: string; redirect?: string } = await res.json();
  return { ...body, id: body.url?.split("/").at(-1) };
}

/** Pays a Checkout in the fake Stripe; the app is not told yet. */
export async function payCheckout(api: APIRequestContext, checkoutId: string) {
  const res = await api.post(
    `/api/e2e/billing/checkout/${encodeURIComponent(checkoutId)}/complete`,
  );
  expect(res.ok(), await res.text()).toBe(true);
  const body: {
    successUrl: string;
    customerId: string;
    subscription: { trialEnd: string | null; periodEnd: string };
  } = await res.json();
  const { trialEnd, periodEnd } = body.subscription;
  return {
    ...body,
    dates: {
      trialEnd: trialEnd ? new Date(trialEnd) : null,
      periodEnd: new Date(periodEnd),
    },
  };
}

/** Changes the user's latest subscription in the fake Stripe and reports it. */
export async function updateSubscription(
  api: APIRequestContext,
  billing: Billing,
  patch: SubscriptionPatch,
) {
  const res = await api.post("/api/e2e/billing/subscription", { data: patch });
  expect(res.ok(), await res.text()).toBe(true);
  const { customerId } = (await res.json()) as { customerId: string };
  billing.dates = { ...billing.dates, ...patch };
  await stripeEvent(api, "customer.subscription.updated", customerId);
}

/**
 * Subscribes the request's user through a paid Checkout and its webhook, then
 * puts the subscription in the given state. New users start on the trial.
 */
export async function subscribe(
  api: APIRequestContext,
  billing: Billing,
  state: SubscriptionState = "active",
) {
  const checkout = await startCheckout(api);
  expect(checkout.id, "Checkout URL").toBeTruthy();
  const { customerId, dates } = await payCheckout(api, checkout.id!);
  Object.assign(billing, { had: true, customerId, dates });
  await stripeEvent(api, "checkout.session.completed", customerId);
  const patch: SubscriptionPatch = subscriptionStates[state];
  if (Object.keys(patch).length) await updateSubscription(api, billing, patch);
}

/**
 * Calls the backend's document routes as the request's user, bypassing the UI
 * (`/api/e2e/backend` forwards the cookie, only to `/documents…`): proves the
 * server is the gate. Resolves to the backend's status code.
 */
export async function callBackend(
  api: APIRequestContext,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  json?: unknown,
) {
  const res = await api.post("/api/e2e/backend", {
    data: { method, path, json },
  });
  expect(res.ok(), await res.text()).toBe(true);
  return ((await res.json()) as { status: number }).status;
}

/** Registers the request's user as an active subscriber (`a logged-in user`). */
export async function registerSubscriber(
  api: APIRequestContext,
  user: Credentials,
  billing: Billing,
) {
  await register(api, user);
  await subscribe(api, billing);
}
