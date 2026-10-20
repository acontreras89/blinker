import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const hero = (page: import("@playwright/test").Page) =>
  page.getByRole("textbox", { name: "Try it: type anything" });

Given("a visitor opens the landing", async ({ page }) => {
  await page.goto("/");
});

Then("they see the product name", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Blinker",
  );
});

Then("every call to action leads to registration", async ({ page }) => {
  const ctas = page.getByRole("link", { name: "Start typing" });
  await expect(ctas.first()).toBeVisible();
  for (const cta of await ctas.all()) {
    await expect(cta).toHaveAttribute("href", "/signup");
  }
});

Then("they see the pricing", async ({ page }) => {
  await expect(
    page.getByRole("region", { name: "Pricing" }).getByText(/\$\d/).first(),
  ).toBeVisible();
});

When("they type {string}", async ({ page }, text: string) => {
  await hero(page).click();
  await page.keyboard.type(text);
});

When("they delete everything they typed", async ({ page }) => {
  await hero(page).press("ControlOrMeta+a");
  await hero(page).press("Backspace");
});

When("they reload the page", async ({ page }) => {
  await page.reload();
});

When("they reset the stats", async ({ page }) => {
  await page.getByRole("button", { name: "Reset stats" }).click();
});

Then("the hero contains {string}", async ({ page }, text: string) => {
  await expect(hero(page)).toHaveText(text);
});

Then("the word count is {int}", async ({ page }, n: number) => {
  await expect(page.getByTestId("words")).toHaveText(String(n));
});

Then("the words per minute are above 0", async ({ page }) => {
  await expect(page.getByTestId("wpm")).not.toHaveText("0");
});

Then("the words per minute are 0", async ({ page }) => {
  await expect(page.getByTestId("wpm")).toHaveText("0");
});
