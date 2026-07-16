import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("quote-builder: palette can insert a Quote block", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");

  await palette.getByRole("button", { name: "Quote" }).click();
  const quoteBlock = canvas.locator("[data-block-type='quote']");
  await expect(quoteBlock).toHaveCount(1);
  await expect(quoteBlock.locator("blockquote")).toHaveCount(1);
});

test("quote-builder: inspector edits quote and attribution independently", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await palette.getByRole("button", { name: "Quote" }).click();
  const quoteBlock = canvas.locator("[data-block-type='quote']");
  await quoteBlock.click();

  await inspector.getByLabel("Quote").fill("Simplicity is the ultimate sophistication.");
  await expect(quoteBlock.locator("blockquote")).toContainText("Simplicity is the ultimate sophistication.");
  await expect(quoteBlock.locator("cite")).toHaveCount(0);

  await inspector.getByLabel("Attribution").fill("Leonardo da Vinci");
  await expect(quoteBlock.locator("cite")).toHaveText("Leonardo da Vinci");
  await expect(quoteBlock.locator("blockquote")).toContainText("Simplicity is the ultimate sophistication.");

  await inspector.getByLabel("Attribution").fill("");
  await expect(quoteBlock.locator("cite")).toHaveCount(0);
  await expect(quoteBlock.locator("blockquote")).toContainText("Simplicity is the ultimate sophistication.");
});

test("quote-builder: save and load preserve quote and attribution", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await palette.getByRole("button", { name: "Quote" }).click();
  const quoteBlock = canvas.locator("[data-block-type='quote']");
  await quoteBlock.click();
  await inspector.getByLabel("Quote").fill("Saved quote text");
  await inspector.getByLabel("Attribution").fill("Saved attribution");

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(canvas.locator("[data-block-type='quote'] blockquote")).toContainText("Saved quote text");
  await expect(canvas.locator("[data-block-type='quote'] cite")).toHaveText("Saved attribution");
});

test("quote-builder: published output uses semantic blockquote and cite markup", async ({ context, page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });

  await page.getByLabel("Project slug").fill("quote-page");
  await palette.getByRole("button", { name: "Quote" }).click();
  await canvas.locator("[data-block-type='quote']").click();
  await inspector.getByLabel("Quote").fill("Published <quote> & text");
  await inspector.getByLabel("Attribution").fill("A & B");

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  await page.getByRole("button", { name: "Publish project" }).click();
  await expect(page.getByRole("status")).toHaveText("Published.");

  const publishedPagePromise = context.waitForEvent("page");
  await page.getByRole("link", { name: "Open published page" }).click();
  const publishedPage = await publishedPagePromise;

  const blockquote = publishedPage.locator("blockquote");
  await expect(blockquote).toHaveCount(1);
  await expect(blockquote.locator("p")).toHaveText("Published <quote> & text");
  await expect(blockquote.locator("cite")).toHaveText("A & B");
  expect(await publishedPage.content()).not.toContain("<script");
});
