import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
  expect: { timeout: 7_000 },
  use: { baseURL: "http://127.0.0.1:4311", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npm run dev",
    url: "http://127.0.0.1:4311/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, NODE_ENV: "test", STOCKMESH_DB: ":memory:", PORT: "4311" },
  },
});
