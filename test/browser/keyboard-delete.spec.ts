import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("keyboard: Delete removes the selected block, Backspace does not, and editable fields are protected", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const blocks = canvas.locator("[data-block-type]");

  await palette.getByRole("button", { name: "Heading" }).click();
  await palette.getByRole("button", { name: "Text" }).click();
  await expect(blocks).toHaveCount(2);

  // Select the heading.
  await canvas.locator("[data-block-type='heading']").click();

  // Backspace must not remove.
  await page.keyboard.press("Backspace");
  await expect(blocks).toHaveCount(2);

  // Delete removes the selected block and moves focus to the remaining block.
  await page.keyboard.press("Delete");
  await expect(blocks).toHaveCount(1);
  await expect(canvas.locator("[data-block-type='text']")).toHaveCount(1);
  await expect(canvas.locator("[data-block-type='text']")).toBeFocused();

  // Delete must not fire while focus is in an editable field.
  await canvas.locator("[data-block-type='text']").click();
  await inspector.getByLabel("Text").click();
  await page.keyboard.press("Delete");
  await expect(blocks).toHaveCount(1);
});
