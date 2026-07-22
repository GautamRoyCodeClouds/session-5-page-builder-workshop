import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("count-builder: shows current/limit, updates on add and remove, and disables the palette at the limit", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const count = page.locator("#block-count");
  const addText = palette.getByRole("button", { name: "Text" });

  await expect(count).toHaveText("0 / 20 blocks");

  await addText.click();
  await expect(count).toHaveText("1 / 20 blocks");

  for (let index = 0; index < 19; index += 1) {
    await addText.click();
  }
  await expect(count).toHaveText("20 / 20 blocks");
  await expect(addText).toBeDisabled();

  // Removing below the limit re-enables additions.
  await canvas.locator("[data-block-type]").first().click();
  await page.getByRole("button", { name: "Remove selected" }).click();
  await expect(count).toHaveText("19 / 20 blocks");
  await expect(addText).toBeEnabled();
});
