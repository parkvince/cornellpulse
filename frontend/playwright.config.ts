import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:4173", channel: "chrome", trace: "retain-on-failure" },
  webServer: {
    command: "npm.cmd run build && npm.cmd run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "320px", use: { viewport: { width: 320, height: 568 } } },
    { name: "small-iphone", use: { ...devices["iPhone SE"] } },
    { name: "modern-iphone", use: { ...devices["iPhone 15"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
})
