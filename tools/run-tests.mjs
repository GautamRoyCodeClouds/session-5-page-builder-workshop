import { spawnSync } from "node:child_process";

const [suite, ...filters] = process.argv.slice(2);
const supported = new Set(["unit", "api", "browser"]);

if (!supported.has(suite)) {
  console.error("Usage: node tools/run-tests.mjs <unit|api|browser> [filter]");
  process.exit(2);
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const childEnvironment = { ...process.env };

if (Number(process.versions.node.split(".")[0]) >= 25) {
  childEnvironment.NODE_OPTIONS = [process.env.NODE_OPTIONS, "--no-webstorage"]
    .filter(Boolean)
    .join(" ");
}

const args = suite === "browser"
  ? ["playwright", "test", "--config", "test/browser/playwright.config.ts", ...filters]
  : [
      "jest",
      "--config",
      suite === "unit" ? "test/jest-unit.config.cjs" : "test/jest-api.config.cjs",
      ...(suite === "api" ? ["--runInBand"] : []),
      ...filters
    ];

const result = spawnSync(executable, args, {
  cwd: process.cwd(),
  env: childEnvironment,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
