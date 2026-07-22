import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("spacer-builder: inserts a spacer with exactly three sizes and retains the choice on reload", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await palette.getByRole("button", { name: "Spacer", exact: true }).click();
  const spacer = canvas.locator("[data-block-type='spacer']");
  await expect(spacer).toHaveCount(1);

  // Exactly small, medium, large.
  const size = inspector.getByLabel("Size");
  await expect(size.locator("option")).toHaveText(["Small", "Medium", "Large"]);

  // Selecting a size updates the fixed-height preview.
  await size.selectOption("large");
  await expect(spacer.locator(".preview-spacer")).toHaveCSS("height", "80px");

  // Save, reload, and confirm the size persists.
  await page.getByRole("region", { name: "Project" }).getByLabel("Project name").fill("Spaced");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await page.getByRole("main", { name: "Canvas" }).locator("#canvas [data-block-type='spacer']").click();
  await expect(page.getByRole("complementary", { name: "Inspector" }).getByLabel("Size")).toHaveValue("large");
});
