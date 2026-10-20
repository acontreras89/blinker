import { expect, type Page } from "@playwright/test";
import { defineParameterType } from "playwright-bdd";
import {
  Given,
  Then,
  When,
  editor,
  expectAskedToLogIn,
  expectLoggedIn,
  fillLogIn,
  logIn,
  register,
} from "./fixtures";

// Steps for the shared phrases in e2e/VOCABULARY.md. Feature-only phrases live
// in their feature's steps file.

// Places map to the routes agreed in the plans; being on one is judged by path.
const places = {
  "the landing": "/",
  "the dashboard": "/app",
  "a blank editor": "/write",
} as const;
type Place = keyof typeof places;

defineParameterType({
  name: "place",
  regexp: new RegExp(Object.keys(places).join("|")),
  transformer: (place: string) => place as Place,
});

const wpm = (page: Page) => page.getByLabel("per minute", { exact: true });

// Actors and sessions

Given("a visitor opens the landing", async ({ page }) => {
  await page.goto("/");
});

Given(
  /^a registered user(?: who is not logged in)?$/,
  async ({ request, user }) => {
    await register(request, user);
  },
);

Given("a logged-in user", async ({ page, user, session }) => {
  await register(page.request, user);
  session.cookies = await page.context().cookies();
  await page.goto(places["the dashboard"]);
});

Given(
  "a user logged in on two devices",
  async ({ request, page, secondDevice, user }) => {
    await register(request, user);
    for (const device of [page, secondDevice]) {
      await logIn(device.context(), user);
      await device.goto(places["the dashboard"]);
    }
  },
);

When("they log in", async ({ page, user }) => {
  // Keep the login page they were sent to, with its return address.
  if (new URL(page.url(), "http://x").pathname !== "/login")
    await page.goto("/login");
  await fillLogIn(page, user.email, user.password);
});

When("they log out", async ({ page }) => {
  await page.getByRole("button", { name: "Log out", exact: true }).click();
});

Then("they are logged in", async ({ page }) => {
  await expectLoggedIn(page.context());
});

Then("they are asked to log in", async ({ page }) => {
  await expectAskedToLogIn(page);
});

// Navigation

When("they open {place}", async ({ page }, place: Place) => {
  await page.goto(places[place]);
});

Then("they are on {place}", async ({ page }, place: Place) => {
  await expect(page).toHaveURL((url) => url.pathname === places[place]);
  if (place === "a blank editor") await expect(editor(page)).toHaveText("");
});

When("they reload the page", async ({ page }) => {
  await page.reload();
});

When("they start typing from the landing", async ({ page }) => {
  await page
    .getByRole("link", { name: "Start typing", exact: true })
    .first()
    .click();
});

// Editing

When("they type {string}", async ({ page }, text: string) => {
  await editor(page).click();
  await page.keyboard.type(text);
});

When("they delete everything they typed", async ({ page }) => {
  await editor(page).press("ControlOrMeta+a");
  await editor(page).press("Backspace");
});

Then("the editor contains {string}", async ({ page }, text: string) => {
  await expect(editor(page)).toHaveText(text);
});

Then("the word count is {int}", async ({ page }, n: number) => {
  await expect(page.getByLabel("words", { exact: true })).toHaveText(String(n));
});

Then("the words per minute are above 0", async ({ page }) => {
  await expect(wpm(page)).not.toHaveText("0");
});

Then("the words per minute are 0", async ({ page }) => {
  await expect(wpm(page)).toHaveText("0");
});
