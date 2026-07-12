module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/api/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  globalSetup: "<rootDir>/test/api/global-setup.cjs",
  setupFiles: ["<rootDir>/test/api/setup-env.cjs"],
  testTimeout: 30000,
  maxWorkers: 1
};
