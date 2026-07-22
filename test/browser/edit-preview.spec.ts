import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("edit-preview: Preview hides editing chrome; returning to Edit restores selection and form values", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const modes = page.getByRole("group", { name: "Editor mode" });
  const editBtn = modes.getByRole("button", { name: "Edit" });
  const previewBtn = modes.getByRole("button", { name: "Preview" });

  await expect(modes.getByRole("button")).toHaveCount(2);
  await expect(editBtn).toHaveAttribute("aria-pressed", "true");

  // Set up a selected block with an edited field.
  await palette.getByRole("button", { name: "Heading" }).click();
  await inspector.getByLabel("Text").fill("My heading");

  // Preview hides palette + inspector.
  await previewBtn.click();
  await expect(previewBtn).toHaveAttribute("aria-pressed", "true");
  await expect(editBtn).toHaveAttribute("aria-pressed", "false");
  await expect(palette).toBeHidden();
  await expect(inspector).toBeHidden();

  // Back to Edit restores chrome, selection, and the form value.
  await editBtn.click();
  await expect(palette).toBeVisible();
  await expect(inspector).toBeVisible();
  await expect(canvas.locator("[data-block-type='heading']")).toHaveAttribute("aria-current", "true");
  await expect(inspector.getByLabel("Text")).toHaveValue("My heading");
});
