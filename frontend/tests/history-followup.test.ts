import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  clearLocalHistory,
  deletePlanEntry,
  exportLocalHistory,
  getHistoryRetention,
  loadLocalHistory,
  MAX_HISTORY_ENTRIES,
  reminderIsDue,
  savePlanEntry,
  setHistoryRetention,
  updatePlanEntry,
} from "../src/history/localHistory.ts"
import { loadLocalMeasurement, recordLocalMeasurement } from "../src/privacy/measurement.ts"

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    values,
  }
}

function plan(id: string, date = "2026-08-01T12:00:00.000Z") {
  return { id, date, mood: 6, resource: "Cornell Health CAPS access appointment", resourceId: "caps_access" }
}

test("history normalizes legacy plans and enforces one retention and size policy", () => {
  const now = new Date("2026-08-02T12:00:00.000Z")
  const entries = Array.from({ length: 24 }, (_, index) => plan(`plan-${index}`, new Date(now.getTime() - index * 86_400_000).toISOString()))
  entries.push(plan("expired", "2026-01-01T12:00:00.000Z"))
  const storage = memoryStorage({ cornellpulse_history: JSON.stringify(entries) })
  const history = loadLocalHistory(storage, now)
  assert.equal(history.length, MAX_HISTORY_ENTRIES)
  assert.equal(history.some(entry => entry.id === "expired"), false)
  assert.ok(history.every(entry => entry.status === "saved"))
  assert.equal(getHistoryRetention(storage), 90)
})

test("plans can be completed, dismissed, replaced, and followed up locally", () => {
  const storage = memoryStorage()
  const now = new Date("2026-08-02T12:00:00.000Z")
  savePlanEntry(plan("one"), storage, now)
  updatePlanEntry("one", { status: "completed", contacted: "contacted", fit: "fit" }, storage, now)
  let [entry] = loadLocalHistory(storage, now)
  assert.deepEqual({ status: entry.status, contacted: entry.contacted, fit: entry.fit }, { status: "completed", contacted: "contacted", fit: "fit" })
  updatePlanEntry("one", { resource: "EARS Peer Mentoring", resourceId: "ears", status: "saved", contacted: undefined, fit: undefined }, storage, now)
  ;[entry] = loadLocalHistory(storage, now)
  assert.deepEqual({ resourceId: entry.resourceId, status: entry.status, contacted: entry.contacted }, { resourceId: "ears", status: "saved", contacted: undefined })
  updatePlanEntry("one", { status: "dismissed" }, storage, now)
  assert.equal(loadLocalHistory(storage, now)[0].status, "dismissed")
})

test("local reminders are due only for active saved plans", () => {
  const now = new Date("2026-08-02T12:00:00.000Z")
  assert.equal(reminderIsDue({ ...plan("due"), status: "saved", reminderAt: "2026-08-02T11:00:00.000Z" }, now), true)
  assert.equal(reminderIsDue({ ...plan("future"), status: "saved", reminderAt: "2026-08-03T11:00:00.000Z" }, now), false)
  assert.equal(reminderIsDue({ ...plan("done"), status: "completed", reminderAt: "2026-08-02T11:00:00.000Z" }, now), false)
})

test("retention, deletion, clearing, and export are explicit and local", () => {
  const storage = memoryStorage({ cornellpulse_history: JSON.stringify([plan("recent"), plan("old", "2025-01-01T00:00:00.000Z")]) })
  const now = new Date("2026-08-02T12:00:00.000Z")
  const retained = setHistoryRetention(30, storage, now)
  assert.deepEqual(retained.map(entry => entry.id), ["recent"])
  assert.equal(getHistoryRetention(storage), 30)
  const exported = exportLocalHistory(retained, now)
  assert.match(exported, /not upload/i)
  assert.equal(/freeText|rawAnswers|email|phone/i.test(exported), false)
  assert.deepEqual(deletePlanEntry("recent", storage, now), [])
  savePlanEntry(plan("again"), storage, now)
  clearLocalHistory(storage)
  assert.deepEqual(loadLocalHistory(storage, now), [])
})

test("privacy-minimized measurement requires consent and stores counters only", () => {
  const storage = memoryStorage()
  assert.equal(recordLocalMeasurement("checkin_completion", undefined, storage, false), false)
  assert.equal(storage.values.has("cornellpulse_local_measurement"), false)
  assert.equal(recordLocalMeasurement("checkin_completion", undefined, storage, true), true)
  recordLocalMeasurement("resource_action", "call", storage, true)
  recordLocalMeasurement("successful_contact", undefined, storage, true)
  recordLocalMeasurement("repeat_use", undefined, storage, true)
  assert.deepEqual(loadLocalMeasurement(storage), {
    checkinCompletion: 1,
    resourceActions: { call: 1, text: 0, book: 0, directions: 0, website: 0, details: 0 },
    successfulContact: 1,
    repeatUse: 1,
  })
  const raw = storage.values.get("cornellpulse_local_measurement") || ""
  assert.equal(/free.?text|raw.?answer|name|email|phone|resourceId/i.test(raw), false)
})

test("navigation and page copy identify History & Privacy instead of an account profile", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const page = readFileSync(new URL("../src/pages/ProfilePage.tsx", import.meta.url), "utf8")
  assert.match(app, /History &amp; Privacy/)
  assert.match(page, /History &amp; Privacy/)
  assert.match(page, /No account is created/)
})
