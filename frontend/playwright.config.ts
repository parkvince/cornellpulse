import { defineConfig, devices, type PlaywrightTestOptions } from "@playwright/test"

function chromeDevice(name: keyof typeof devices): PlaywrightTestOptions {
  const device = { ...devices[name] }
  delete device.defaultBrowserType
  return { ...device, browserName: "chromium", channel: "chrome" }
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:4173", channel: "chrome", trace: "retain-on-failure" },
  webServer: {
    command: "npm.cmd run build && npm.cmd run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "320px", use: { viewport: { width: 320, height: 568 } } },
    { name: "small-iphone", use: chromeDevice("iPhone SE") },
    { name: "modern-iphone", use: chromeDevice("iPhone 15") },
    { name: "android", use: chromeDevice("Pixel 7") },
    { name: "tablet", use: chromeDevice("iPad (gen 7)") },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
})
