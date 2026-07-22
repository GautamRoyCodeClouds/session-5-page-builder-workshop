import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("inspector: collapse hides fields from view and tab order; expand restores values and selection", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const toggle = page.locator("#inspector-toggle");
  const fields = page.locator("#inspector-fields");

  await palette.getByRole("button", { name: "Heading" }).click();
  await inspector.getByLabel("Text").fill("Keep me");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(fields).toBeVisible();

  // Collapse hides the fields (view + tab order).
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(fields).toBeHidden();
  await expect(inspector.getByLabel("Text")).toBeHidden();

  // Expand restores the unsaved value and the selected block.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(fields).toBeVisible();
  await expect(inspector.getByLabel("Text")).toHaveValue("Keep me");
  await expect(canvas.locator("[data-block-type='heading']")).toHaveAttribute("aria-current", "true");
});
