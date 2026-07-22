import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("unsaved: edits mark Unsaved, save returns to Saved, failed save stays Unsaved, load starts Saved", async ({ context, page }) => {
  const saveState = page.locator("#save-state");
  const palette = page.getByRole("region", { name: "Palette" });

  await expect(saveState).toHaveText("Saved");

  // Editing blocks marks Unsaved.
  await palette.getByRole("button", { name: "Heading" }).click();
  await expect(saveState).toHaveText("Unsaved");

  // A successful save returns to Saved.
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  await expect(saveState).toHaveText("Saved");

  // Editing project metadata marks Unsaved.
  await page.getByRole("region", { name: "Project" }).getByLabel("Project name").fill("Renamed");
  await expect(saveState).toHaveText("Unsaved");

  // A failed save leaves the state Unsaved.
  await context.route("http://127.0.0.1:3102/api/projects/*", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Server error" }) });
    } else {
      await route.fallback();
    }
  });
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toContainText("Save failed");
  await expect(saveState).toHaveText("Unsaved");

  // Loading a project starts in the Saved state.
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(saveState).toHaveText("Saved");
});
