import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("button-builder: offers primary/secondary styles, defaults primary, and preserves the choice", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await palette.getByRole("button", { name: "Button", exact: true }).click();

  const style = inspector.getByLabel("Style");
  await expect(style.locator("option")).toHaveText(["Primary", "Secondary"]);
  await expect(style).toHaveValue("primary");

  const preview = canvas.locator("[data-block-type='button'] .preview-link");
  await expect(preview).toHaveClass(/preview-link-primary/);

  await style.selectOption("secondary");
  await expect(preview).toHaveClass(/preview-link-secondary/);

  // Save + reload preserves the selected style.
  await page.getByRole("region", { name: "Project" }).getByLabel("Project name").fill("Buttons");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await page.getByRole("main", { name: "Canvas" }).locator("#canvas [data-block-type='button']").click();
  await expect(page.getByRole("complementary", { name: "Inspector" }).getByLabel("Style")).toHaveValue("secondary");
});
