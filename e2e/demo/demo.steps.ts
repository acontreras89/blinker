import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { When, editor, focusEditorEnd, test } from "../steps/fixtures";

// Steps only the demo has. Loaded by playwright.demo.config.ts alone, so the
// pauses below never slow the suite. Pace for a viewer, not for a test.

const { AfterStep } = createBdd(test);

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

// A beat after every step so each change registers on video.
AfterStep(async ({ page }) => pause(page, 800));

/** Scrolls by wheel, like a person, until the target is in view. */
async function scrollTo(page: Page, target: ReturnType<Page["locator"]>) {
  for (let i = 0; i < 40; i++) {
    const box = await target.boundingBox();
    const height = page.viewportSize()!.height;
    if (box && box.y >= 0 && box.y < height * 0.3) return;
    await page.mouse.wheel(0, box && box.y < 0 ? -200 : 200);
    await pause(page, 60);
  }
}

When("they look around the landing", async ({ page }) => {
  await pause(page, 2000);
  await page.mouse.move(640, 360);
  for (const name of ["Pricing", "FAQ"]) {
    const region = page
      .getByRole("region", { name })
      .or(page.locator(`#${name.toLowerCase()}`))
      .first();
    await scrollTo(page, region);
    await pause(page, 2500);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(page, 1500);
});

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
    await pause(page, 1000);
    await page
      .getByTestId("hosted-payment-submit-button")
      .or(page.locator('button[type="submit"]'))
      .first()
      .click();
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
