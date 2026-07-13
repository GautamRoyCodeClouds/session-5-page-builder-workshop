import { expect, test } from "@playwright/test";
import { installBaselineRoutes } from "./baseline-flow-fixture";

test.beforeEach(async ({ context, page }) => {
  await installBaselineRoutes(context);
  await page.goto("/");
});

test("baseline-flow: application shell", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Page builder" })).toBeAttached();

  const projectPanel = page.getByRole("region", { name: "Project" });
  await expect(projectPanel.getByLabel("Project name")).toHaveValue("Untitled page");
  await expect(projectPanel.getByLabel("Project slug")).toHaveValue("untitled-page");
  await expect(projectPanel.getByLabel("Text color")).toHaveValue("#1f2933");
  await expect(projectPanel.getByLabel("Button color")).toHaveValue("#176b5b");
  await expect(page.getByRole("banner").getByRole("textbox")).toHaveCount(0);

  const palette = page.getByRole("region", { name: "Palette" });
  const paletteButtons = palette.getByRole("button");
  await expect(paletteButtons).toHaveText(["Heading", "Text", "Button", "Section"]);
  await expect(paletteButtons).toHaveCount(4);
  for (const button of await paletteButtons.all()) {
    await expect(button).toHaveAttribute("draggable", "true");
  }

  await expect(page.getByRole("main", { name: "Canvas" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Inspector" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove selected" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save project" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish project" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open published page" })).toBeHidden();
  await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");

  await palette.getByRole("button", { name: "Heading" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-block-type='heading']")).toHaveCount(1);
});

test("baseline-flow: block lifecycle", async ({ page }) => {
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");

  await palette.getByRole("button", { name: "Heading" }).click();
  await palette.getByRole("button", { name: "Text" }).dragTo(canvas);
  await palette.getByRole("button", { name: "Button" }).click();
  await palette.getByRole("button", { name: "Section" }).click();

  const blocks = canvas.locator("[data-block-type]");
  await expect(blocks).toHaveCount(4);
  await expect.poll(async () => blocks.evaluateAll((items) => (
    items.map((item) => item.getAttribute("data-block-type"))
  ))).toEqual(["heading", "text", "button", "section"]);

  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await canvas.locator("[data-block-type='heading']").click();
  await inspector.getByLabel("Text").fill("Launch page");
  await inspector.getByLabel("Level").selectOption("3");
  await expect(canvas.getByRole("heading", { level: 3, name: "Launch page" })).toBeVisible();

  await canvas.locator("[data-block-type='text']").click();
  await inspector.getByLabel("Text").fill("A saved project becomes static output.");
  await expect(canvas.getByText("A saved project becomes static output.")).toBeVisible();

  await canvas.locator("[data-block-type='button']").click();
  await inspector.getByLabel("Label").fill("Read the guide");
  await inspector.getByLabel("URL").fill("https://example.com/guide");
  await expect(canvas.getByText("Read the guide", { exact: true })).toBeVisible();

  await canvas.locator("[data-block-type='section']").click();
  await inspector.getByLabel("Title").fill("Details");
  await expect(canvas.getByRole("heading", { level: 2, name: "Details" })).toBeVisible();
  await page.getByRole("button", { name: "Remove selected" }).click();
  await expect(blocks).toHaveCount(3);

  await canvas.locator("[data-block-type='button']").dragTo(canvas.locator("[data-block-type='heading']"));
  await expect.poll(async () => blocks.evaluateAll((items) => (
    items.map((item) => item.getAttribute("data-block-type"))
  ))).toEqual(["button", "heading", "text"]);

  for (let index = 0; index < 17; index += 1) {
    await palette.getByRole("button", { name: "Text" }).click();
  }
  await expect(blocks).toHaveCount(20);
  await palette.getByRole("button", { name: "Text" }).click();
  await expect(blocks).toHaveCount(20);
  await expect(page.getByRole("status")).toContainText("Block limit reached");

  for (const excludedName of ["Divider", "Image", "Spacer", "Duplicate", "Move up", "Move down", "Preview"]) {
    await expect(page.getByRole("button", { name: excludedName, exact: true })).toHaveCount(0);
  }
});

test("baseline-flow: project lifecycle", async ({ context, page }) => {
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/projects")) {
      apiCalls.push(`${request.method()} ${url.pathname}`);
    }
  });

  await page.getByLabel("Project name").fill("Launch kit");
  await page.getByLabel("Project slug").fill("launch-kit");
  await page.getByRole("region", { name: "Palette" }).getByRole("button", { name: "Heading" }).click();
  await page.locator("[data-block-type='heading']").click();
  await page.getByRole("complementary", { name: "Inspector" }).getByLabel("Text").fill("Launch page");

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");
  const projectId = new URL(page.url()).searchParams.get("project");
  expect(projectId).toBeTruthy();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("page-builder.projectId"))).toBe(projectId);
  await expect(page.getByRole("button", { name: "Load project" })).toBeEnabled();

  await page.getByRole("complementary", { name: "Inspector" }).getByLabel("Text").fill("Launch page v2");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  await page.getByRole("complementary", { name: "Inspector" }).getByLabel("Text").fill("Local draft");
  await page.getByRole("button", { name: "Load project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(page.getByRole("heading", { name: "Launch page v2" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(page.getByRole("heading", { name: "Launch page v2" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("project")).toBe(projectId);

  await page.getByRole("button", { name: "Publish project" }).click();
  await expect(page.getByRole("status")).toHaveText("Published.");
  const openPublished = page.getByRole("link", { name: "Open published page" });
  await expect(openPublished).toHaveAttribute("href", "/sites/launch-kit");

  const publishedPagePromise = context.waitForEvent("page");
  await openPublished.click();
  const publishedPage = await publishedPagePromise;
  await expect(publishedPage).toHaveTitle("Launch kit");
  await expect(publishedPage.getByRole("heading", { name: "Launch page v2" })).toBeVisible();

  expect(apiCalls).toEqual([
    "POST /api/projects",
    `PUT /api/projects/${projectId}`,
    `GET /api/projects/${projectId}`,
    `GET /api/projects/${projectId}`,
    `POST /api/projects/${projectId}/publish`
  ]);
});

test("baseline-flow: project text and button colors", async ({ page }) => {
  const projectPanel = page.getByRole("region", { name: "Project" });
  const textColorInput = projectPanel.getByLabel("Text color");
  const buttonColorInput = projectPanel.getByLabel("Button color");
  const palette = page.getByRole("region", { name: "Palette" });
  const canvas = page.getByRole("main", { name: "Canvas" }).locator("#canvas");
  const heading = canvas.locator("[data-block-type='heading'] h2");
  const buttonPreview = canvas.locator("[data-block-type='button'] .preview-link");

  await palette.getByRole("button", { name: "Heading" }).click();
  await palette.getByRole("button", { name: "Button" }).click();
  await expect(heading).toHaveCSS("color", "rgb(31, 41, 51)");
  await expect(buttonPreview).toHaveCSS("background-color", "rgb(23, 107, 91)");

  await textColorInput.fill("#112233");
  await buttonColorInput.fill("#445566");
  await expect(heading).toHaveCSS("color", "rgb(17, 34, 51)");
  await expect(buttonPreview).toHaveCSS("background-color", "rgb(68, 85, 102)");

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(textColorInput).toHaveValue("#112233");
  await expect(buttonColorInput).toHaveValue("#445566");
  await expect(heading).toHaveCSS("color", "rgb(17, 34, 51)");

  await page.getByRole("button", { name: "New project" }).click();
  await expect(textColorInput).toHaveValue("#1f2933");
  await expect(buttonColorInput).toHaveValue("#176b5b");
});

test("baseline-flow: browse all projects", async ({ page }) => {
  const dialog = page.getByRole("dialog", { name: "All projects" });

  await page.getByRole("button", { name: "All projects" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("No projects saved yet.")).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();

  await page.getByLabel("Project name").fill("Launch kit");
  await page.getByLabel("Project slug").fill("launch-kit");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("status")).toHaveText("Project saved.");

  await page.getByRole("button", { name: "All projects" }).click();
  await expect(dialog.getByText("launch-kit")).toBeVisible();
  await expect(dialog.getByText(/Draft/)).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue("Untitled page");

  await page.getByRole("button", { name: "All projects" }).click();
  await dialog.getByRole("button", { name: "Open" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("Project loaded.");
  await expect(page.getByLabel("Project name")).toHaveValue("Launch kit");
});
