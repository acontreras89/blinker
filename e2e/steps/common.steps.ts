import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";

// Steps for the shared phrases in e2e/VOCABULARY.md. Feature-only phrases live
// in their feature's steps file.
const { Given, When, Then } = createBdd();

// The editor on screen: the landing hero or the app editor.
const editor = (page: Page) =>
  page.getByRole("textbox").and(page.locator("[contenteditable]"));
const wpm = (page: Page) => page.getByLabel("per minute", { exact: true });

Given("a visitor opens the landing", async ({ page }) => {
  await page.goto("/");
});

When("they reload the page", async ({ page }) => {
  await page.reload();
});

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
