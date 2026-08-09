import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8")
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8")
const emergency = readFileSync(new URL("../src/components/shared/EmergencyHelp.tsx", import.meta.url), "utf8")
const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8")

test("app shell exposes landmarks, navigation state, skip link, and route announcements", () => {
  assert.match(app, /<main id="app-scroll-container"/)
  assert.match(app, /<nav aria-label="Primary"/)
  assert.match(app, /aria-current=/)
  assert.match(app, /className="skip-link"/)
  assert.match(app, /aria-live="polite"/)
})

test("focus, zoom, safe areas, keyboard visibility, and reduced motion remain enabled", () => {
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale/i)
  assert.match(html, /viewport-fit=cover/)
  assert.doesNotMatch(css, /:focus[^{]*\{[^}]*outline:\s*none/s)
  assert.match(css, /input:focus-visible/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /safe-area-inset-bottom/)
  assert.match(css, /min-height:\s*44px/)
  assert.match(app, /scrollIntoView/)
})

test("emergency modal traps focus, closes with Escape, and restores focus", () => {
  assert.match(emergency, /aria-modal="true"/)
  assert.match(emergency, /event\.key === "Escape"/)
  assert.match(emergency, /event\.key !== "Tab"/)
  assert.match(emergency, /previouslyFocused \|\| opener/)
  assert.match(emergency, /aria-describedby="immediate-help-description"/)
})

test("web install metadata and native privacy configuration are present", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"))
  assert.equal(manifest.name, "CornellPulse")
  assert.equal(manifest.display, "standalone")
  assert.deepEqual(manifest.icons.map((icon: { sizes: string }) => icon.sizes), ["192x192", "512x512"])
  assert.equal(existsSync(new URL("../public/icon-192.png", import.meta.url)), true)
  assert.match(serviceWorker, /precacheShell/)
  assert.match(serviceWorker, /html\.matchAll/)
  assert.match(serviceWorker, /request\.mode === "navigate"/)
  assert.equal(existsSync(new URL("../ios/App/App/Info.plist", import.meta.url)), true)
  const androidManifest = readFileSync(new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8")
  assert.match(androidManifest, /android:allowBackup="false"/)
  assert.match(androidManifest, /android:usesCleartextTraffic="false"/)
})
