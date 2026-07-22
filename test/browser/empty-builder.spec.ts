import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("empty-builder: shows an empty state whose action focuses the palette without adding a block", async ({ page }) => {
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const palette = page.getByRole("region", { name: "Palette" });
  const emptyState = page.getByRole("note", { name: "Empty canvas" });

  await expect(emptyState).toBeVisible();
  await expect(canvas.locator("[data-block-type]")).toHaveCount(0);

  // The action focuses the first palette item and adds nothing.
  await page.getByRole("button", { name: "Add your first block" }).click();
  await expect(palette.getByRole("button", { name: "Heading" })).toBeFocused();
  await expect(canvas.locator("[data-block-type]")).toHaveCount(0);
  await expect(emptyState).toBeVisible();

  // Adding a block hides the empty state (no reload).
  await palette.getByRole("button", { name: "Text" }).click();
  await expect(canvas.locator("[data-block-type]")).toHaveCount(1);
  await expect(emptyState).toBeHidden();
});
