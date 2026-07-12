import { defineConfig } from "@playwright/test";

const taskFilters = [
  "accessibility",
  "builder",
  "drag-reorder",
  "inspector",
  "keyboard",
  "preview",
  "save",
  "save-publish",
  "save-reload",
  "unsaved"
];
let requestedTaskFilter: string | undefined;
for (const taskFilter of taskFilters) {
  if (process.argv.includes(taskFilter)) requestedTaskFilter = taskFilter;
}

export default defineConfig({
  testDir: ".",
  testMatch: requestedTaskFilter ? `**/*${requestedTaskFilter}*.spec.ts` : "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3102",
    headless: true,
    trace: "retain-on-failure"
  }
});
