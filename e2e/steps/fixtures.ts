import { randomUUID } from "node:crypto";
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
// (docs/plans/E5-documents.md, "Save states" and "Two tabs").
export const saveCopy = {
  unsaved: "Unsaved changes",
  saved: "Saved",
  failed: "Not saved. The server blinked first. Save again.",
  warned: "Not saved yet. Trying again on your next change.",
  overwrote: "Edited elsewhere too. This version won.",
  changedElsewhere: "Changed elsewhere. Reload, or save to overwrite.",
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
