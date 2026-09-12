import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

// Ephemeral fixture-only value; no real account credentials are loaded.
process.env.CAMPUSCONNECT_TEST_PASSWORD ||= `${randomBytes(24).toString("base64url")}aA1!`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/journey.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium-fixture", use: { ...devices["Desktop Chrome"], viewport: { width: 1365, height: 900 } } }],
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://127.0.0.1:3101/login",
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      CAMPUSCONNECT_E2E: "1",
      CAMPUSCONNECT_TEST_PASSWORD: process.env.CAMPUSCONNECT_TEST_PASSWORD,
    },
  },
});
