const { spawnSync } = require("node:child_process");

// The API suite runs against an isolated test database (session5_test by
// default). Apply the committed migrations before any test connects so a fresh
// `npm run test:api` provisions its own schema without a hidden manual step.
module.exports = function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL
    || "postgresql://session5:session5@127.0.0.1:54329/session5_test?schema=public";
  const directUrl = process.env.DIRECT_URL || databaseUrl;

  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl }
  });

  if (result.status !== 0) {
    throw new Error("Failed to apply migrations to the API test database");
  }
};
