import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { clearCornellPulseDeviceData, parsePrivacyPreferences, savePrivacyPreferences } from "../src/privacy/preferences.ts"


function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    values,
  }
}


function sourceText(directory: string): string {
  return readdirSync(directory, { withFileTypes: true }).map(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceText(path)
    return /\.(py|ts|tsx)$/.test(entry.name) ? readFileSync(path, "utf8") : ""
  }).join("\n")
}


test("optional privacy choices default off, including malformed stored values", () => {
  assert.deepEqual(parsePrivacyPreferences(null), { aggregateContribution: false, resourceAnalytics: false, productMeasurement: false })
  assert.deepEqual(parsePrivacyPreferences("not-json"), { aggregateContribution: false, resourceAnalytics: false, productMeasurement: false })
  assert.deepEqual(parsePrivacyPreferences(JSON.stringify({ aggregateContribution: "yes", resourceAnalytics: 1, productMeasurement: "on" })), { aggregateContribution: false, resourceAnalytics: false, productMeasurement: false })
})


test("privacy choices require explicit true values and device clearing removes known keys", () => {
  const local = memoryStorage({ cornellpulse_history: "[]", cornellpulse_onboarded: "true" })
  const session = memoryStorage({ cornellpulse_checkin_draft: "{}", cornellpulse_checkin_draft_v2: "{}", cornellpulse_result_saved: "1" })
  savePrivacyPreferences({ aggregateContribution: true, resourceAnalytics: false, productMeasurement: true }, local)
  assert.equal(JSON.parse(local.values.get("cornellpulse_privacy_preferences") || "{}").aggregateContribution, true)
  assert.equal(JSON.parse(local.values.get("cornellpulse_privacy_preferences") || "{}").productMeasurement, true)

  clearCornellPulseDeviceData(local, session)
  assert.equal(local.values.size, 0)
  assert.equal(session.values.size, 0)
})


test("inaccurate legacy privacy claims cannot return to frontend source", () => {
  const source = [sourceText(join(process.cwd(), "src")), sourceText(join(process.cwd(), "..", "backend", "app"))].join("\n").toLowerCase()
  const prohibitedClaims = [
    "completely anonymous. always",
    "never saved anywhere",
    "nothing is ever sent",
    "everything stays on your device",
    "never stores your check-in answers",
    "your responses were not saved to our servers",
  ]
  for (const claim of prohibitedClaims) assert.equal(source.includes(claim), false, `Prohibited privacy claim returned: ${claim}`)
})

test("privacy UI and policy materials disclose implemented retention, logs, backups, and limits", () => {
  const privacyPage = readFileSync(join(process.cwd(), "src", "pages", "PrivacyPage.tsx"), "utf8")
  const policy = readFileSync(join(process.cwd(), "..", "PRIVACY_POLICY.md"), "utf8")
  const consent = readFileSync(join(process.cwd(), "..", "CONSENT_MATERIALS.md"), "utf8")
  for (const required of ["30 days", "two days", "14 days", "90 days", "365 days", "Backups", "cannot be linked back", "no active Redis integration", "privacy/legal approval is pending"]) {
    assert.ok(privacyPage.includes(required), `Privacy UI must disclose: ${required}`)
  }
  const normalizedPolicy = policy.toLowerCase()
  for (const required of ["campus-wide utc-date count", "immutable/offline backups", "provider acceptance is not proof of delivery"]) {
    assert.ok(normalizedPolicy.includes(required), `Policy must disclose: ${required}`)
  }
  assert.match(policy, /DRAFT PENDING PRIVACY\/LEGAL APPROVAL/)
  assert.match(consent, /unchecked by default/)
  assert.match(consent, /does not authorize transmission/)
})
