import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("image-builder: inserts an Image block with URL and alt-text fields", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");

  await palette.getByRole("button", { name: "Image", exact: true }).click();

  const image = canvas.locator("[data-block-type='image']");
  await expect(image).toHaveCount(1);
  await expect(image.locator("img")).toHaveCount(1);

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await expect(inspector.getByLabel("Image URL")).toBeVisible();
  await expect(inspector.getByLabel("Alt text")).toBeVisible();
});

test("image-builder: empty alt blocks save with a visible message; filling it allows save and publish", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/projects")) calls.push(`${request.method()} ${url.pathname}`);
  });

  const palette = page.getByRole("region", { name: "Palette" });
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await palette.getByRole("button", { name: "Image", exact: true }).click();
  await inspector.getByLabel("Image URL").fill("https://example.com/a.png");

  // Alt is empty by default → save is blocked with a visible message and no request.
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Add alt text to every image before saving.");
  expect(calls.some((call) => call.startsWith("POST") || call.startsWith("PUT"))).toBe(false);

  // Filling alt unblocks the save.
  await inspector.getByLabel("Alt text").fill("A sample image");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  expect(calls).toContain("POST /api/projects");

  // And the published output can be generated.
  await page.getByRole("button", { name: "Publish project" }).click();
  await expect(page.getByRole("status")).toHaveText("Published.");
});
