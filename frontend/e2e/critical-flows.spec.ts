import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function completeOnboarding(page: Page) {
  await page.goto("/onboarding")
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: /I understand/ }).click()
  await expect(page.getByRole("heading", { name: /Find the right support/ })).toBeVisible()
}

async function completeStructuredCheckin(page: Page, mood = 6) {
  await page.getByRole("radio", { name: new RegExp(`^${mood}:`) }).check()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("radio", { name: "6 to 8 hours" }).check()
  await page.getByRole("radio", { name: /Moderate/ }).check()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("checkbox", { name: "Academics" }).check()
  await page.getByRole("radio", { name: "Not right now" }).check()
  await page.getByRole("button", { name: "Continue" }).click()
}

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter(violation => ["serious", "critical"].includes(violation.impact || ""))
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
}

test("onboarding, navigation, emergency dialog, resources, privacy, Peer sandbox, and disabled routes", async ({ page }) => {
  await completeOnboarding(page)
  await expectNoSeriousAxeViolations(page)
  await page.getByRole("button", { name: "Immediate help" }).click()
  await expect(page.getByRole("dialog", { name: "Get immediate help" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Close immediate help" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Get immediate help" })).toBeHidden()
  await expect(page.getByRole("button", { name: "Immediate help" })).toBeFocused()
  await page.getByRole("link", { name: "Resources" }).click()
  await expectNoSeriousAxeViolations(page)
  await page.getByLabel("Search resources").fill("988")
  await expect(page.getByText("988 Suicide & Crisis Lifeline", { exact: true })).toBeVisible()
  await page.getByRole("article").filter({ hasText: "988 Suicide & Crisis Lifeline" }).getByRole("link", { name: "View details and actions" }).click()
  await expect(page.getByRole("heading", { name: "988 Suicide & Crisis Lifeline" })).toBeVisible()
  await page.goto("/resources/caps_access")
  await expect(page.getByRole("link", { name: "Directions" })).toHaveCount(0)
  await page.goto("/resources/cornell_botanic_gardens")
  await expect(page.getByRole("link", { name: "Directions" })).toHaveAttribute("href", /google\.com\/maps\/search/)
  await page.goto("/privacy")
  await expect(page.getByRole("heading", { name: "Your choices and data" })).toBeVisible()
  await expectNoSeriousAxeViolations(page)
  await page.route("http://localhost:8000/api/v1/peer-supporters", route => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }))
  const peerTab = page.getByRole("link", { name: "Peer Connect" })
  await expect(peerTab).toBeVisible()
  await peerTab.click()
  await expect(page.getByRole("heading", { name: "Talk to a student who gets it." })).toBeVisible()
  await expect(page.getByText("Cornell identity verification coming soon", { exact: true })).toBeVisible()
  await expect(peerTab).toHaveAttribute("aria-current", "page")
  await expectNoSeriousAxeViolations(page)
  await page.goto("/peer/signup")
  await expect(page.getByRole("heading", { name: "Talk to a student who gets it." })).toBeVisible()
  await page.goto("/peer/reference")
  await expect(page.getByRole("heading", { name: "Coming back after safety review" })).toBeVisible()
  await page.goto("/admin")
  await expect(page.getByRole("heading", { name: "Coming back after safety review" })).toBeVisible()
  await page.goto("/not-a-real-route")
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
})

test("Peer sandbox creates a real requester and submits a server-backed connection request", async ({ page }) => {
  const supporterId = "11111111-1111-4111-8111-111111111111"
  const requesterId = "22222222-2222-4222-8222-222222222222"
  await page.route("http://localhost:8000/api/v1/peer-supporters", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ supporter_id: supporterId, display_name: "Open Sandbox Peer", year: "Junior", major: "History", locations: ["Willard Straight Hall"], availability: ["Afternoons"], interests: ["Music"], about: "Signed up through the open sandbox.", identity_status: "unverified" }]) }))
  await page.route("http://localhost:8000/api/v1/peer/requesters", route => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ requester_id: requesterId, access_token: "sandbox-requester-token", identity_status: "unverified_sandbox" }) }))
  await page.route("http://localhost:8000/api/v1/peer/public-meeting-options", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ locations: [{ id: "willard_straight", name: "Willard Straight Hall", rule: "Public common area" }], meeting_windows: [{ id: "weekday_daytime", name: "Weekday daytime", rule: "Daytime only" }], safety_note: "Meet in a public area and leave whenever you want." }) }))
  await page.route("http://localhost:8000/api/v1/peer/auth/login", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ access_token: "sandbox-requester-token" }) }))
  await page.route("http://localhost:8000/api/v1/peer-connect", route => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ request_id: "33333333-3333-4333-8333-333333333333", status: "pending" }) }))
  await completeOnboarding(page)
  await page.goto("/peer")
  await expect(page.getByRole("heading", { name: "Talk to a student who gets it." })).toBeVisible()
  await expect(page.getByText("Identity not verified", { exact: true })).toBeVisible()
  await page.getByRole("tab", { name: "Get requester ID" }).click()
  await page.getByLabel("Display name").fill("Requester One")
  await page.getByLabel("Email").fill("requester@example.com")
  await page.getByLabel("Password").fill("correct-horse-battery")
  await page.getByRole("button", { name: "Create requester account" }).click()
  await expect(page.getByText(requesterId, { exact: true })).toBeVisible()
  await page.getByRole("tab", { name: "Find peers" }).click()
  await page.getByRole("button", { name: "Ask to meet up" }).click()
  await page.getByPlaceholder("Your requester ID").fill(requesterId)
  await page.getByPlaceholder("Your requester password").fill("correct-horse-battery")
  await page.getByRole("radio", { name: "Willard Straight Hall" }).click()
  await page.getByRole("radio", { name: "Weekday daytime" }).click()
  await page.getByRole("checkbox", { name: /I choose to send this request/ }).check()
  await page.getByRole("button", { name: "Send request" }).click()
  await expect(page.getByRole("heading", { name: "Request pending" })).toBeVisible()
  await expectNoSeriousAxeViolations(page)
})

test("check-in completes locally and results can be saved", async ({ page }) => {
  await completeOnboarding(page)
  await page.getByRole("link", { name: "Start a check-in" }).first().click()
  await completeStructuredCheckin(page)
  await page.getByRole("button", { name: "Find resources" }).click()
  await expect(page.getByRole("heading", { name: /Choose a next step/ })).toBeVisible()
  await page.getByRole("button", { name: "Choose this as my next step" }).first().click()
  await page.getByRole("button", { name: "Save this plan on this device" }).click()
  await expect(page.getByText("Plan saved on this device. It is available in your local check-in history.", { exact: true })).toBeVisible()
  await page.goto("/profile")
  await expect(page.getByRole("heading", { name: "History & Privacy" })).toBeVisible()
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export local history as JSON" }).click()
  const exportedHistory = await download
  await exportedHistory.delete()
  await page.getByRole("button", { name: "Delete" }).first().click()
  await page.getByRole("button", { name: "Delete plan" }).click()
  await expect(page.getByText("No saved plans", { exact: true })).toBeVisible()
})

test("check-in validation, Back, keyboard, and draft deletion remain usable", async ({ page }) => {
  await completeOnboarding(page)
  await page.goto("/checkin")
  await page.getByRole("button", { name: "Continue" }).click()
  await expect(page.getByRole("alert")).toHaveText("Choose a number before continuing.")
  const mood = page.getByRole("radio", { name: /6: Getting through it/ })
  await mood.focus()
  await page.keyboard.press("Space")
  await expect(mood).toBeChecked()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("button", { name: "Back" }).click()
  await expect(mood).toBeChecked()
  page.once("dialog", dialog => dialog.accept())
  await page.getByRole("button", { name: "Delete this check-in" }).click()
  await expect(page.getByRole("heading", { name: "How are you feeling today?" })).toBeVisible()
  await expect(page.getByRole("radio", { name: /6: Getting through it/ })).not.toBeChecked()
})

test("crisis language routes to immediate support without an ordinary best match", async ({ page }) => {
  await completeOnboarding(page)
  await page.goto("/checkin")
  await completeStructuredCheckin(page, 2)
  await page.getByLabel("Additional context").fill("I want to kill myself")
  await page.getByRole("button", { name: "Find resources" }).click()
  await expect(page.getByText("Immediate support", { exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Choose the support that fits right now" })).toBeVisible()
  await expect(page.getByText("911 emergency response", { exact: true })).toBeVisible()
  await expect(page.getByText("988 Suicide & Crisis Lifeline", { exact: true })).toBeVisible()
  await expect(page.getByText("Cornell Health 24/7 phone consultation", { exact: true })).toBeVisible()
  await expect(page.getByText(/Best match/i)).toHaveCount(0)
  await expectNoSeriousAxeViolations(page)
})

test("optional aggregate failure is reported without losing local results", async ({ page }) => {
  await completeOnboarding(page)
  await page.evaluate(() => localStorage.setItem("cornellpulse_privacy_preferences", JSON.stringify({ aggregateContribution: true, resourceAnalytics: false, productMeasurement: false })))
  await page.route("http://localhost:8000/api/v1/checkin/aggregate", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "maintenance" }) }))
  await page.goto("/checkin")
  await completeStructuredCheckin(page)
  await page.getByRole("button", { name: "Find resources" }).click()
  await expect(page.getByRole("heading", { name: /Choose a next step/ })).toBeVisible()
  await expect(page.getByText("Your local recommendation is ready, but the optional completion count could not be sent.", { exact: true })).toBeVisible()
})

test("offline state is explicit and local resources remain readable", async ({ page, context }) => {
  await completeOnboarding(page)
  await page.goto("/resources")
  await context.setOffline(true)
  try {
    await page.reload().catch(() => undefined)
    await expect(page.getByText(/You’re offline/).first()).toBeVisible()
    await expect(page.getByText("988 Suicide & Crisis Lifeline", { exact: true })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})

test("zoom-equivalent reflow and reduced motion remain usable", async ({ page }) => {
  await completeOnboarding(page)
  await page.emulateMedia({ reducedMotion: "reduce" })

  for (const viewport of [
    { label: "200%", width: 640, height: 720 },
    { label: "400%", width: 320, height: 568 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const route of ["/", "/checkin", "/resources", "/privacy", "/profile"]) {
      await page.goto(route)
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        helpVisible: [...document.querySelectorAll("button")].some(button => button.textContent?.includes("Immediate help")),
        maxTransitionMs: Math.max(...[...document.querySelectorAll<HTMLElement>("*")].map(element => {
          const duration = getComputedStyle(element).transitionDuration
          return duration.split(",").reduce((max, value) => Math.max(max, Number.parseFloat(value) * (value.includes("ms") ? 1 : 1000)), 0)
        })),
      }))
      expect(layout.overflow, `${viewport.label} ${route} must reflow without document overflow`).toBe(false)
      expect(layout.helpVisible, `${viewport.label} ${route} must keep emergency access visible`).toBe(true)
      expect(layout.maxTransitionMs, `${viewport.label} ${route} must honor reduced motion`).toBeLessThanOrEqual(1)
    }
  }
})

test("manifest is valid install metadata", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest")
  expect(response.ok()).toBeTruthy()
  const manifest = await response.json()
  expect(manifest.name).toBe("CornellPulse")
  expect(manifest.display).toBe("standalone")
  expect(manifest.start_url).toBe("/")
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ sizes: "192x192" }), expect.objectContaining({ sizes: "512x512" })]))
  const serviceWorker = await request.get("/sw.js")
  expect(serviceWorker.ok()).toBeTruthy()
  const serviceWorkerSource = await serviceWorker.text()
  expect(serviceWorkerSource).toMatch(/precacheShell/)
  expect(serviceWorkerSource).toMatch(/html\.matchAll/)
  expect(serviceWorkerSource).toMatch(/request\.mode === "navigate"/)
})
