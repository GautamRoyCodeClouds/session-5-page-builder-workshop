import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("duplicate-builder: duplicates the selected block after it with a distinct id and selects the copy", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const duplicate = page.getByRole("button", { name: "Duplicate selected" });

  // Disabled when nothing is selected.
  await expect(duplicate).toBeDisabled();

  await palette.getByRole("button", { name: "Heading" }).click();
  await inspector.getByLabel("Text").fill("Hello");
  await expect(duplicate).toBeEnabled();

  await duplicate.click();

  const headings = canvas.locator("[data-block-type='heading']");
  await expect(headings).toHaveCount(2);
  await expect(canvas.getByRole("heading", { name: "Hello" })).toHaveCount(2);

  const allBlocks = canvas.locator("[data-block-type]");
  const firstId = await allBlocks.nth(0).getAttribute("data-block-id");
  const secondId = await allBlocks.nth(1).getAttribute("data-block-id");
  expect(firstId).not.toBe(secondId);

  // The copy (inserted immediately after the source) is selected.
  await expect(allBlocks.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(allBlocks.nth(0)).toHaveAttribute("aria-current", "false");
});
