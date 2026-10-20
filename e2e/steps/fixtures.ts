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

type Fixtures = {
  /** The scenario's user: fresh credentials, registered only if a step does. */
  user: Credentials;
  /** The cookies of the session a step logged in with, to replay later. */
  session: { cookies: Cookie[] };
  /** The user's second device: a separate browser context. */
  secondDevice: Page;
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
