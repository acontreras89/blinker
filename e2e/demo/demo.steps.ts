import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { When, editor, focusEditorEnd, test } from "../steps/fixtures";

// Steps only the demo has. Loaded by playwright.demo.config.ts alone, so the
// pauses below never slow the suite. Pace for a viewer, not for a test.

const { AfterStep } = createBdd(test);

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

// A beat after every step so each change registers on video.
AfterStep(async ({ page }) => pause(page, 800));

// Through the sticky header's section links, which scroll smoothly; one FAQ
// opened on the way. Back to the hero at the end, where the typing happens.
When("they look around the landing", async ({ page }) => {
  await pause(page, 2000);
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of ["What it does", "Pricing", "FAQ"]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await pause(page, 2500);
  }
  await page.getByText("Where do my documents live?", { exact: true }).click();
  await pause(page, 3000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(page, 1500);
});

// A beat of doubt, then the excuses: the full stop becomes a comma.
When("they hesitate", async ({ page }) => {
  await pause(page, 3000);
});

When(
  "they trade the full stop for {string}",
  async ({ page, typingDelay }, rest: string) => {
    await focusEditorEnd(page);
    await page.keyboard.press("Backspace");
    await pause(page, 600);
    await page.keyboard.type(rest, { delay: typingDelay });
  },
);

// Stripe's hosted Checkout, test mode. Its markup is Stripe's, so locate by
// label with the known ids as a fallback. Test card: README → Stripe test flow.
When(
  "they pay in Stripe Checkout with a test card",
  async ({ page, billing, typingDelay }) => {
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
    const field = (label: RegExp, id: string) =>
      page.locator(`#${id}`).or(page.getByLabel(label)).first();
    const type = async (label: RegExp, id: string, value: string) => {
      const f = field(label, id);
      await f.click();
      await f.pressSequentially(value, { delay: typingDelay });
    };
    await expect(field(/card number/i, "cardNumber")).toBeVisible({
      timeout: 30_000,
    });
    await pause(page, 1500);
    await type(/card number/i, "cardNumber", "4242424242424242");
    await type(/expir/i, "cardExpiry", "1234");
    await type(/cvc/i, "cardCvc", "123");
    await type(/name on card|cardholder/i, "billingName", "Ada Lovelace");
    const postal = page.locator("#billingPostalCode");
    if (await postal.isVisible()) await postal.fill("10001");
    // On screen before it is pressed, so the payment doesn't start off-camera.
    const pay = page
      .getByTestId("hosted-payment-submit-button")
      .or(page.locator('button[type="submit"]'))
      .first();
    await pay.scrollIntoViewIfNeeded();
    await pause(page, 1500);
    await pay.click();
    billing.had = true;
    // Back through the return page; the webhook or the return sync unlocks.
    await page.waitForURL((url) => url.pathname.startsWith("/write"), {
      timeout: 60_000,
    });
    await expect(editor(page)).toBeVisible();
    await pause(page, 2000);
  },
);

// A heading, a list and a bold word, by Markdown and shortcut.
When("they try out the formatting", async ({ page, typingDelay }) => {
  const type = (text: string) =>
    page.keyboard.type(text, { delay: typingDelay });
  await focusEditorEnd(page);
  await page.keyboard.press("Enter");
  await type("## Plan");
  await page.keyboard.press("Enter");
  await type("- Open the document");
  await page.keyboard.press("Enter");
  await type("Write ");
  await page.keyboard.press("ControlOrMeta+b");
  await type("one");
  await page.keyboard.press("ControlOrMeta+b");
  await type(" paragraph");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
});

// Hovering shows each control's tooltip with its shortcut.
When("they look up a couple of shortcuts", async ({ page }) => {
  const toolbar = page.getByRole("toolbar", {
    name: "Formatting",
    exact: true,
  });
  for (const target of [
    toolbar.getByRole("button", { name: "Bold", exact: true }),
    page.getByRole("button", { name: "Save", exact: true }),
  ]) {
    await target.hover();
    await pause(page, 2000);
  }
  await page.mouse.move(640, 500);
});

When("they turn on the fireworks", async ({ page }) => {
  await page.getByRole("switch", { name: "Fireworks", exact: true }).click();
});

// The relative time's tooltip shows the exact date.
When(
  "they check when {string} was last updated",
  async ({ page }, title: string) => {
    const entry = page.getByRole("listitem").filter({
      has: page.getByRole("link", { name: title, exact: true }),
    });
    await entry
      .getByText(/^Updated/)
      .locator("time")
      .hover();
    await pause(page, 2500);
  },
);

When("they look at their billing", async ({ page }) => {
  await page.getByRole("link", { name: "Billing", exact: true }).click();
  const manage = { name: "Manage billing", exact: true };
  await expect(
    page.getByRole("button", manage).or(page.getByRole("link", manage)).first(),
  ).toBeVisible();
  await pause(page, 3500);
});

// Dark for a moment, then back to the system's (light in the recording).
When("they try the dark theme", async ({ page }) => {
  // The theme button cycles System → Light → Dark.
  const toggle = page.getByRole("button", { name: /^Theme: / });
  for (const theme of ["Dark", "System"]) {
    const target = page.getByRole("button", {
      name: `Theme: ${theme}`,
      exact: true,
    });
    while (!(await target.isVisible())) await toggle.click();
    await pause(page, 3000);
  }
});
