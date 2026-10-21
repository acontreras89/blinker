import { expect } from "@playwright/test";
import { Then } from "./fixtures";

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
