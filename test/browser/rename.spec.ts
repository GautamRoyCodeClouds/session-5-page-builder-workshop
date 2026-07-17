import { expect, test, type Page } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

function trackApiCalls(page: Page): string[] {
  const calls: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/projects")) {
      calls.push(`${request.method()} ${url.pathname}`);
    }
  });
  return calls;
}

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("rename: committing a header edit on a saved project calls the rename endpoint", async ({ page }) => {
  const calls = trackApiCalls(page);

  // Save first so the project has an id to rename against.
  await page.getByRole("region", { name: "Project" }).getByLabel("Project name").fill("Draft name");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  const projectId = new URL(page.url()).searchParams.get("project");
  expect(projectId).toBeTruthy();

  const titleInput = page.getByRole("banner").getByLabel("Project title");
  await titleInput.fill("Renamed via header");
  await titleInput.press("Enter");

  await expect(page.getByRole("status")).toHaveText("Project renamed.");
  expect(calls).toContain(`PATCH /api/projects/${projectId}/name`);
  // The rename does not re-save blocks or republish.
  expect(calls.filter((call) => call === `PUT /api/projects/${projectId}`)).toHaveLength(0);
  expect(calls.some((call) => call.endsWith("/publish"))).toBe(false);
  // Builder state reflects the new name.
  await expect(
    page.getByRole("region", { name: "Project" }).getByLabel("Project name")
  ).toHaveValue("Renamed via header");
});

test("rename: a never-saved project falls back to the normal save flow", async ({ page }) => {
  const calls = trackApiCalls(page);

  const titleInput = page.getByRole("banner").getByLabel("Project title");
  await titleInput.fill("First title");
  await titleInput.blur();

  await expect(page.getByRole("status")).toHaveText("Project saved.");
  expect(calls).toContain("POST /api/projects");
  expect(calls.some((call) => call.endsWith("/name"))).toBe(false);
});

test("rename: a blank title shows the validation message and sends no request", async ({ page }) => {
  const calls = trackApiCalls(page);

  const titleInput = page.getByRole("banner").getByLabel("Project title");
  await titleInput.fill("");
  await titleInput.blur();

  await expect(page.getByRole("status")).toHaveText("Enter a valid project name and slug.");
  expect(
    calls.filter((call) => /^(PATCH|POST|PUT)/.test(call))
  ).toHaveLength(0);
});

test("rename: a failed rename surfaces the error and keeps the title editable", async ({ context, page }) => {
  await page.getByRole("region", { name: "Project" }).getByLabel("Project name").fill("Draft");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  // Force the rename endpoint to fail.
  await context.route("http://127.0.0.1:3102/api/projects/*/name", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ statusCode: 500, code: "INTERNAL", message: "Server error" })
    })
  );

  const titleInput = page.getByRole("banner").getByLabel("Project title");
  await titleInput.fill("Will fail");
  await titleInput.press("Enter");

  await expect(page.getByRole("status")).toContainText("Rename failed:");
  await expect(titleInput).toBeEditable();
});
