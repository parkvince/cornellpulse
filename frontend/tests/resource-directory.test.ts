import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { callHref, filterResources, getAvailability, isResourceStale, resourcePath, textHref } from "../src/resources/directory.ts"
import { ACTIVE_RESOURCES, getResource, type ResourceRecord } from "../src/resources/registry.ts"

test("24/7 services are always included by Open now", () => {
  const overnight = new Date("2026-08-02T06:00:00Z")
  const open = filterResources(ACTIVE_RESOURCES, "", { openNow: true }, overnight)
  const expected = ["emergency_911", "cornell_public_safety", "988_lifeline", "cornell_health_247", "crisis_text_line", "cayuga_medical_er"]
  for (const id of expected) assert.ok(open.some(resource => resource.id === id), `${id} should be open 24/7`)
  assert.equal(open.filter(resource => resource.availability.kind === "always").length, expected.length)
})

test("weekly availability uses the resource timezone", () => {
  const center = getResource("identity_support")
  assert.equal(getAvailability(center, new Date("2026-08-03T14:00:00Z")), "open")
  assert.equal(getAvailability(center, new Date("2026-08-03T22:00:00Z")), "closed")

  const seoulSchedule = {
    ...center,
    timezone: "Asia/Seoul",
    availability: { kind: "weekly", intervals: [{ days: ["mon"], start: "09:00", end: "17:00" }] },
  } as ResourceRecord
  assert.equal(getAvailability(seoulSchedule, new Date("2026-08-03T00:30:00Z")), "open")
  assert.equal(getAvailability({ ...seoulSchedule, timezone: "America/New_York" }, new Date("2026-08-03T00:30:00Z")), "closed")
})

test("dated hours override the regular weekly schedule", () => {
  const pantry = getResource("basic_needs")
  assert.equal(getAvailability(pantry, new Date("2026-08-04T19:30:00Z")), "open")
  assert.equal(getAvailability(pantry, new Date("2026-08-04T18:30:00Z")), "closed")
})

test("search and decision filters compose", () => {
  assert.deepEqual(filterResources(ACTIVE_RESOURCES, "food").map(resource => resource.id), ["basic_needs"])
  assert.deepEqual(filterResources(ACTIVE_RESOURCES, "peer mentoring").map(resource => resource.id), ["ears"])

  const results = filterResources(ACTIVE_RESOURCES, "", {
    cost: "free",
    urgency: "routine",
    eligibility: "cornell_student",
    modality: "online",
    scope: "campus",
    appointment: "required",
    category: "Cornell",
  })
  assert.deepEqual(results.map(resource => resource.id), ["caps_access"])
})

test("deep links and text actions are resource-specific", () => {
  assert.equal(resourcePath("caps_access"), "/resources/caps_access")
  assert.equal(textHref(getResource("crisis_text_line")), "sms:741741?body=HOME")
  assert.equal(callHref(getResource("crisis_text_line")), undefined)

  const app = readFileSync(join(process.cwd(), "src", "App.tsx"), "utf8")
  const home = readFileSync(join(process.cwd(), "src", "pages", "HomePage.tsx"), "utf8")
  assert.match(app, /path="\/resources\/:resourceId"/)
  assert.match(home, /to=\{resourcePath\(resource\)\}/)
})

test("directory and details expose operational states", () => {
  const directory = readFileSync(join(process.cwd(), "src", "pages", "ResourcesPage.tsx"), "utf8")
  const detail = readFileSync(join(process.cwd(), "src", "pages", "ResourceDetailPage.tsx"), "utf8")
  for (const label of ["You’re offline", "Loading verified resources", "older than 180 days", "No verified resources are available", "No resources match those choices"]) assert.ok(directory.includes(label))
  for (const label of ["What happens next", "Last verified", "Open official source", "Resource not found"]) assert.ok(detail.includes(label))
  assert.equal(isResourceStale(getResource("988_lifeline"), new Date("2027-03-01T00:00:00Z")), true)
})
