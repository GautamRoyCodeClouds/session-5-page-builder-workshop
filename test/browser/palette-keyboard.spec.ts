import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("palette-keyboard: roving tabindex, arrow navigation with wrap, and Enter/Space add", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const buttons = palette.getByRole("button");

  // Exactly one item is in the tab order.
  await expect(buttons.nth(0)).toHaveAttribute("tabindex", "0");
  await expect(buttons.nth(1)).toHaveAttribute("tabindex", "-1");

  // Arrow keys move focus and the roving tabindex.
  await buttons.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(1)).toBeFocused();
  await expect(buttons.nth(1)).toHaveAttribute("tabindex", "0");
  await expect(buttons.nth(0)).toHaveAttribute("tabindex", "-1");

  // End jumps to the last item; ArrowRight wraps to the first.
  await page.keyboard.press("End");
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(0)).toBeFocused();

  // Enter adds the focused block.
  await page.keyboard.press("Enter");
  await expect(canvas.locator("[data-block-type='heading']")).toHaveCount(1);

  // Space adds the focused block too.
  await buttons.nth(1).focus();
  await page.keyboard.press("Space");
  await expect(canvas.locator("[data-block-type='text']")).toHaveCount(1);
});
