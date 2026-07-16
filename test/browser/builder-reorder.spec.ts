import { expect, test } from "@playwright/test";

import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("builder: reorders the selected block and saves its order", async ({ page }) => {
  let savedBlockTypes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST" || new URL(request.url()).pathname !== "/api/projects") return;
    savedBlockTypes = (request.postDataJSON() as { blocks: Array<{ type: string }> }).blocks
      .map((block) => block.type);
  });

  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  const moveUp = inspector.getByRole("button", { name: "Move up" });
  const moveDown = inspector.getByRole("button", { name: "Move down" });

  await palette.getByRole("button", { name: "Heading" }).click();
  await palette.getByRole("button", { name: "Text" }).click();
  await palette.getByRole("button", { name: "Button" }).click();

  await canvas.locator("[data-block-type='heading']").click();
  await expect(moveUp).toBeDisabled();
  await expect(moveDown).toBeEnabled();

  await moveDown.click();
  await expect.poll(async () => canvas.locator("[data-block-type]").evaluateAll((items) => (
    items.map((item) => item.getAttribute("data-block-type"))
  ))).toEqual(["text", "heading", "button"]);
  await expect(canvas.locator("[data-block-type='heading']")).toHaveAttribute("aria-current", "true");
  await expect(moveUp).toBeEnabled();
  await expect(moveDown).toBeEnabled();

  await moveUp.click();
  await expect.poll(async () => canvas.locator("[data-block-type]").evaluateAll((items) => (
    items.map((item) => item.getAttribute("data-block-type"))
  ))).toEqual(["heading", "text", "button"]);
  await expect(moveUp).toBeDisabled();

  await canvas.locator("[data-block-type='button']").click();
  await expect(moveDown).toBeDisabled();

  await canvas.locator("[data-block-type='heading']").click();
  await moveDown.click();
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  expect(savedBlockTypes).toEqual(["text", "heading", "button"]);
});
