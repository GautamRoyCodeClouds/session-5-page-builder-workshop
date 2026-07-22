import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("preview-modes: desktop/mobile control narrows the canvas without mutating blocks", async ({ page }) => {
  const group = page.getByRole("group", { name: "Preview mode" });
  const desktop = group.getByRole("button", { name: "Desktop" });
  const mobile = group.getByRole("button", { name: "Mobile" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");

  // Exactly two modes; desktop active by default.
  await expect(group.getByRole("button")).toHaveCount(2);
  await expect(desktop).toHaveAttribute("aria-pressed", "true");
  await expect(mobile).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("region", { name: "Palette" }).getByRole("button", { name: "Text" }).click();
  const desktopBox = await canvas.boundingBox();

  // Switching to mobile narrows the canvas and flips aria-pressed.
  await mobile.click();
  await expect(mobile).toHaveAttribute("aria-pressed", "true");
  await expect(desktop).toHaveAttribute("aria-pressed", "false");
  await expect(canvas).toHaveClass(/is-mobile-preview/);

  const mobileBox = await canvas.boundingBox();
  expect(mobileBox?.width ?? 0).toBeLessThan(desktopBox?.width ?? 0);

  // Blocks are untouched by the view change.
  await expect(canvas.locator("[data-block-type]")).toHaveCount(1);
});
