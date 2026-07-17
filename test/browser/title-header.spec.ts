import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("title-header: edits the project title from the header and persists after save", async ({ page }) => {
  const header = page.getByRole("banner");
  const titleInput = header.getByLabel("Project title");
  await expect(titleInput).toHaveValue("Untitled page");

  // A valid edit updates builder state (mirrors the panel name field) and marks it unsaved.
  await titleInput.fill("Launch kit");
  await expect(
    page.getByRole("region", { name: "Project" }).getByLabel("Project name")
  ).toHaveValue("Launch kit");
  await expect(page.getByRole("status")).toHaveText("Unsaved changes.");

  // Save, then reload — the edited title comes back.
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(header.getByLabel("Project title")).toHaveValue("Launch kit");
});

test("title-header: a blank title shows the validation message and is not saved", async ({ page }) => {
  const titleInput = page.getByRole("banner").getByLabel("Project title");
  await titleInput.fill("");
  await expect(page.getByRole("status")).toHaveText("Enter a valid project name and slug.");

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Enter a valid project name and slug.");
});
