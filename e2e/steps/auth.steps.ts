import { expect } from "@playwright/test";
import {
  Given,
  Then,
  When,
  credentials,
  expectAlert,
  expectAskedToLogIn,
  expectFieldError,
  expectLoggedIn,
  fillLogIn,
  fillSignUp,
} from "./fixtures";

// Error copy, in the product's voice (docs/DESIGN.md#voice).
const copy = {
  nameMissing: "Tell us who you are. Any name will do.",
  emailInvalid: "That's not an email. It needs an @ and a dot, at least.",
  passwordShort: "Too short. Give it 8 characters, the cursor can wait.",
  emailTaken: "That email already has an account. Log in instead.",
  badCredentials: "Wrong email or password. The cursor saw nothing.",
};

// Registering

Given("a visitor is registering", async ({ page }) => {
  await page.goto("/signup");
});

When("they register with valid details", async ({ page, user }) => {
  await fillSignUp(page, user);
});

When("they register with an empty name", async ({ page, user }) => {
  await fillSignUp(page, { ...user, name: "" });
});

When("they register with an invalid email", async ({ page, user }) => {
  await fillSignUp(page, { ...user, email: "ada.example.com" });
});

When("they register with a too short password", async ({ page, user }) => {
  await fillSignUp(page, { ...user, password: "short" });
});

When(
  "they register with the registered user's email",
  async ({ page, user }) => {
    await fillSignUp(page, { ...credentials(), email: user.email });
  },
);

// Registering logs in on the spot, so no session means no account was made.
Then("they are not registered", async ({ page }) => {
  await expectLoggedIn(page.context(), false);
});

Then("they are told their name is missing", async ({ page }) => {
  await expectFieldError(page, "Name", copy.nameMissing);
});

Then("they are told their email is invalid", async ({ page }) => {
  await expectFieldError(page, "Email", copy.emailInvalid);
});

Then("they are told their password is too short", async ({ page }) => {
  await expectFieldError(page, "Password", copy.passwordShort);
});

Then("they are told the email is already registered", async ({ page }) => {
  await expectAlert(page, copy.emailTaken);
});

// Logging in

Given("a visitor is logging in", async ({ page }) => {
  await page.goto("/login");
});

// SHORT ON PURPOSE: proves login does not apply the signup password rules.
When(
  "they log in with their email and a short wrong password",
  async ({ page, user }) => {
    await page.goto("/login");
    await fillLogIn(page, user.email, "nope");
  },
);

When("they log in with an email nobody registered", async ({ page }) => {
  const nobody = credentials();
  await page.goto("/login");
  await fillLogIn(page, nobody.email, nobody.password);
});

When("they log in with an invalid email", async ({ page, user }) => {
  await fillLogIn(page, "ada.example.com", user.password);
});

When(
  "they log in through a link that returns them to {string}",
  async ({ page, user }, target: string) => {
    await page.goto(`/login?next=${encodeURIComponent(target)}`);
    await fillLogIn(page, user.email, user.password);
  },
);

Then("they are told the email or password is incorrect", async ({ page }) => {
  await expectAlert(page, copy.badCredentials);
});

// Landing

Then(
  "the landing offers to open the app instead of logging in",
  async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Open app", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Log in", exact: true }),
    ).toHaveCount(0);
  },
);

// Logging out

When("they log out on the first device", async ({ page }) => {
  await page.getByRole("button", { name: "Log out", exact: true }).click();
});

// Replays the old cookie in a clean browser: only the server can refuse it.
Then(
  "the session they had is rejected by the server",
  async ({ browser, session }) => {
    const context = await browser.newContext();
    await context.addCookies(session.cookies);
    const page = await context.newPage();
    await page.goto("/app");
    await expectAskedToLogIn(page);
    await context.close();
  },
);

Then("the first device is logged out", async ({ page }) => {
  await expectLoggedIn(page.context(), false);
});

Then("the second device is still logged in", async ({ secondDevice }) => {
  await expectLoggedIn(secondDevice.context());
});
