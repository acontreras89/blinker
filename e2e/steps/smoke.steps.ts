import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

When("a visitor opens the home page", async ({ page }) => {
  await page.goto("/");
});

Then("they see the product name", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

Then("the backend status is {string}", async ({ page }, status: string) => {
  await expect(page.getByText(`Backend: ${status}`)).toBeVisible();
});
