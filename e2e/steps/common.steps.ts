import { expect, type Page } from "@playwright/test";
import { defineParameterType } from "playwright-bdd";
import {
  Given,
  Then,
  When,
  editor,
  expectAskedToLogIn,
  expectInvitedToSubscribe,
  expectLoggedIn,
  fillLogIn,
  focusEditorEnd,
  logIn,
  register,
  registerSubscriber,
  checkoutCopy,
  documentPath,
  save,
  saveCopy,
  seedDocument,
  stripePaths,
  subscribe,
  subscriptionStates,
  type SubscriptionState,
} from "./fixtures";

// Steps for the shared phrases in e2e/VOCABULARY.md. Feature-only phrases live
// in their feature's steps file.

// User-facing copy, in the product's voice (docs/DESIGN.md#voice).
const copy = {
  noDocuments: "Nothing here yet.",
};

// Places map to the routes agreed in the plans; being on one is judged by path.
const places = {
  "the landing": "/",
  "the dashboard": "/app",
  "a blank editor": "/write",
  "their billing page": "/account/billing",
} as const;
type Place = keyof typeof places;

defineParameterType({
  name: "place",
  regexp: new RegExp(Object.keys(places).join("|")),
  transformer: (place: string) => place as Place,
});

defineParameterType({
  name: "state",
  // Longest first, so "canceled at period end, …" never stops at "canceled".
  regexp: new RegExp(
    Object.keys(subscriptionStates)
      .sort((a, b) => b.length - a.length)
      .join("|"),
  ),
  transformer: (state: string) => state as SubscriptionState,
});

const wpm = (page: Page) => page.getByLabel("per minute", { exact: true });

// A document on the dashboard is a link to its address, named by its title.
const listed = (page: Page) =>
  page.getByRole("link").and(page.locator('[href^="/write/"]'));
const listedAs = (page: Page, title: string) =>
  listed(page).and(page.getByRole("link", { name: title, exact: true }));
const titles = (list: string) => list.split(",").map((t) => t.trim());

/**
 * Judges the dashboard where the scenario is, or in a new tab so the
 * scenario's page stays in place.
 */
async function onDashboard(
  page: Page,
  check: (dashboard: Page) => Promise<void>,
) {
  if (new URL(page.url()).pathname === places["the dashboard"])
    return check(page);
  const tab = await page.context().newPage();
  await tab.goto(places["the dashboard"]);
  await check(tab);
  await tab.close();
}

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

Given("a logged-in user", async ({ page, user, session, billing }) => {
  await registerSubscriber(page.request, user, billing);
  session.cookies = await page.context().cookies();
  await page.goto(places["the dashboard"]);
});

Given("a logged-in user without a subscription", async ({ page, user }) => {
  await register(page.request, user);
  await page.goto(places["the dashboard"]);
});

Given("a logged-in user on a trial", async ({ page, user, billing }) => {
  await register(page.request, user);
  await subscribe(page.request, billing, "trialing");
  await page.goto(places["the dashboard"]);
});

Given(
  "a logged-in user whose subscription is {state}",
  async ({ page, user, billing }, state: SubscriptionState) => {
    await register(page.request, user);
    await subscribe(page.request, billing, state);
    await page.goto(places["the dashboard"]);
  },
);

Given(
  "a logged-in user with the documents {string}",
  async ({ page, user, docs, billing }, list: string) => {
    await registerSubscriber(page.request, user, billing);
    // Created in that order, a minute apart, so "newest" is unambiguous.
    const start = Date.now() - 60 * 60_000;
    for (const [i, title] of titles(list).entries()) {
      const at = new Date(start + i * 60_000);
      docs.byTitle[title] = await seedDocument(page.request, {
        title,
        createdAt: at,
        updatedAt: at,
      });
    }
    await page.goto(places["the dashboard"]);
  },
);

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

// Billing

// Pays in the fake Checkout they are on and comes back through the return page.
When("they subscribe", async ({ page, billing }) => {
  await expect(page).toHaveURL((url) =>
    url.pathname.startsWith(stripePaths.checkout),
  );
  await page
    .getByRole("button", { name: checkoutCopy.pay, exact: true })
    .click();
  billing.had = true;
});

Then("they are in Checkout", async ({ page }) => {
  await expect(page).toHaveURL((url) =>
    url.pathname.startsWith(stripePaths.checkout),
  );
});

// Lapsed users are invited back, the others to start.
Then("they are invited to subscribe", async ({ page, billing }) => {
  await expectInvitedToSubscribe(page, billing);
});

// Navigation

When("they open {place}", async ({ page }, place: Place) => {
  await page.goto(places[place]);
});

When("they open {string}", async ({ page, docs }, title: string) => {
  await page.goto(documentPath(docs.byTitle[title].id));
});

Then("they are on {place}", async ({ page }, place: Place) => {
  await expect(page).toHaveURL((url) => url.pathname === places[place]);
  if (place === "a blank editor") await expect(editor(page)).toHaveText("");
  // The billing page is where they manage billing.
  if (place === "their billing page")
    await expect(
      page
        .getByRole("link", { name: "Manage billing", exact: true })
        .or(page.getByRole("button", { name: "Manage billing", exact: true }))
        .first(),
    ).toBeVisible();
});

When("they reload the page", async ({ page }) => {
  await page.reload();
});

Then("they are told the page does not exist", async ({ page }) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Blank page.", exact: true }),
  ).toBeVisible();
});

When("they start typing from {place}", async ({ page }, place: Place) => {
  if (new URL(page.url()).pathname !== places[place])
    await page.goto(places[place]);
  await page
    .getByRole("link", { name: "Start typing", exact: true })
    .first()
    .click();
});

// Editing

When("they type {string}", async ({ page, typingDelay }, text: string) => {
  await focusEditorEnd(page);
  await page.keyboard.type(text, { delay: typingDelay });
});

When("they delete everything they typed", async ({ page }) => {
  await editor(page).press("ControlOrMeta+a");
  await editor(page).press("Backspace");
});

Then("the editor contains {string}", async ({ page }, text: string) => {
  await expect(editor(page)).toHaveText(text);
});

Then("the editor does not contain {string}", async ({ page }, text: string) => {
  await expect(editor(page)).toBeVisible();
  await expect(editor(page)).not.toContainText(text);
});

// From the dashboard's Start typing. A subscriber gets a blank editor, types
// and saves; without a subscription it opens Checkout, and a trial at its
// limit says so (before the editor or on saving it: the UI's choice).
// "Untitled, Untitled (2)" → "Untitled (1)" PROVES THE LOWEST FREE NUMBER IS
// REUSED, NOT MAX + 1 (documents.feature).
When("they create a document", async ({ page, typingDelay }) => {
  if (new URL(page.url()).pathname !== places["the dashboard"])
    await page.goto(places["the dashboard"]);
  await page
    .getByRole("link", { name: "Start typing", exact: true })
    .or(page.getByRole("button", { name: "Start typing", exact: true }))
    .first()
    .click();
  const writable = editor(page)
    .and(page.locator('[contenteditable="true"]'))
    .first();
  const trialLimit = page
    .getByRole("alert")
    .filter({ hasText: saveCopy.trialLimit })
    .first();
  await expect
    .poll(
      async () =>
        new URL(page.url()).pathname.startsWith(stripePaths.checkout) ||
        (await writable.isVisible()) ||
        (await trialLimit.isVisible()),
    )
    .toBe(true);
  if (!(await writable.isVisible())) return;
  await focusEditorEnd(page);
  await page.keyboard.type("A new document", { delay: typingDelay });
  await save(page);
});

When("they save the document", async ({ page }) => {
  await save(page);
});

Then("the dashboard lists {string}", async ({ page }, list: string) => {
  const wanted = titles(list);
  await onDashboard(page, async (dashboard) => {
    for (const title of new Set(wanted))
      await expect(listedAs(dashboard, title)).toHaveCount(
        wanted.filter((t) => t === title).length,
      );
  });
});

Then(
  "the dashboard lists {string} in that order",
  async ({ page }, list: string) => {
    await onDashboard(page, async (dashboard) => {
      await expect(listed(dashboard)).toHaveText(titles(list));
    });
  },
);

Then("the dashboard does not list {string}", async ({ page }, list: string) => {
  await onDashboard(page, async (dashboard) => {
    for (const title of titles(list))
      await expect(listedAs(dashboard, title)).toHaveCount(0);
  });
});

Then("they are told they have no documents yet", async ({ page }) => {
  await expect(page.getByText(copy.noDocuments, { exact: true })).toBeVisible();
  await expect(listed(page)).toHaveCount(0);
});

Then("the word count is {int}", async ({ page }, n: number) => {
  await expect(page.getByLabel(/^words?$/)).toHaveText(String(n));
});

Then("the words per minute are above 0", async ({ page }) => {
  await expect(wpm(page)).not.toHaveText("0");
});

Then("the words per minute are 0", async ({ page }) => {
  await expect(wpm(page)).toHaveText("0");
});

When("they reset the stats", async ({ page, speed }) => {
  speed.beforeReset = Number(await wpm(page).textContent());
  await page.getByRole("button", { name: "Reset stats", exact: true }).click();
});
