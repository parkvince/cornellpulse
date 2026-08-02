import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { submitAggregateContribution } from "../src/api/client.ts"
import { assessSafetySignal, buildLocalRecommendation } from "../src/checkin/localRecommendations.ts"
import { getResource } from "../src/resources/registry.ts"

const SENSITIVE_CANARY = "SENSITIVE_CANARY_free_text_741"

test("free text affects local safety routing without entering an aggregate request", async () => {
  const result = buildLocalRecommendation({
    mood: 7,
    sleep: "6_to_8",
    workload: "moderate",
    triggers: [],
    wantsToTalk: false,
    freeText: `I am thinking about suicide ${SENSITIVE_CANARY}`,
  })
  assert.equal(result.safety.signal, "check-in")

  let requestBody = ""
  const fakeFetch: typeof fetch = async (_input, init) => {
    requestBody = String(init?.body || "")
    return new Response(JSON.stringify({ aggregate_updated: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  await submitAggregateContribution({
    mood_score: 7,
    sleep_category: "6_to_8",
    workload_category: "moderate",
    college: "engineering",
  }, fakeFetch, "https://example.invalid/api/v1")

  assert.deepEqual(Object.keys(JSON.parse(requestBody)).sort(), ["college", "mood_score", "sleep_category", "workload_category"])
  assert.equal(requestBody.includes(SENSITIVE_CANARY), false)
  assert.equal(/free.?text|trigger|talk|session|token|recommendation/i.test(requestBody), false)
})

test("explicit first-person crisis phrases route separately to urgent help", () => {
  const phrases = [
    "I am going to kill myself",
    "I want to die",
    "I can't keep myself safe",
    "I plan to hurt myself",
    "I am not suicidal, but I am going to kill myself",
  ]
  for (const phrase of phrases) assert.deepEqual(assessSafetySignal(phrase, 7), { signal: "urgent", reason: "explicit-language" })
})

test("negated and obvious contextual mentions do not become urgent keyword matches", () => {
  const phrases = [
    "I am not suicidal",
    "I don't want to die",
    "I would never hurt myself",
    "We discussed suicide prevention in class",
    "My research paper is about self-harm awareness",
  ]
  for (const phrase of phrases) assert.equal(assessSafetySignal(phrase, 7).signal, "none", phrase)
})

test("mood boundary prompts a check-in without claiming a crisis", () => {
  assert.deepEqual(assessSafetySignal("", 1), { signal: "check-in", reason: "low-mood" })
  assert.deepEqual(assessSafetySignal("", 2), { signal: "check-in", reason: "low-mood" })
  assert.deepEqual(assessSafetySignal("", 3), { signal: "none", reason: "none" })
})

test("empty and ambiguous input are handled without clinical certainty", () => {
  assert.deepEqual(assessSafetySignal("   ", 6), { signal: "none", reason: "none" })
  assert.deepEqual(assessSafetySignal("I keep thinking about death", 6), { signal: "check-in", reason: "ambiguous-language" })
  assert.deepEqual(assessSafetySignal("Everything feels hard", 6), { signal: "none", reason: "none" })
})

test("emergency text actions use sms links with prefilled text", () => {
  assert.deepEqual(getResource("988_lifeline").textAction, { number: "988", prefilledText: "Hello, I need support." })
  assert.equal(getResource("emergency_911").phone, "911")
  assert.equal(getResource("cornell_public_safety").phone, "607-255-1111")
  assert.equal(getResource("cornell_health_247").phone, "607-255-5155")
})

test("check-in source never writes free text or drafts to browser storage", () => {
  const flow = readFileSync(join(process.cwd(), "src", "components", "checkin", "CheckInFlow.tsx"), "utf8")
  const resultCard = readFileSync(join(process.cwd(), "src", "components", "checkin", "ResultCard.tsx"), "utf8")
  assert.equal(/sessionStorage\.setItem/.test(flow + resultCard), false)
  assert.equal(/localStorage\.setItem\([^\n]*freeText/.test(flow + resultCard), false)
  assert.equal(flow.includes("submitAggregateContribution({\n        mood_score: mood,\n        sleep_category: sleep,\n        workload_category: workload,\n        college: college || \"other\","), true)
})

test("server check-in boundaries contain no free text, Redis key, analytics, or logging sink", () => {
  const backendRoot = join(process.cwd(), "..", "backend", "app")
  const boundaryFiles = [
    join(backendRoot, "routers", "checkin.py"),
    join(backendRoot, "services", "aggregation.py"),
    join(backendRoot, "models", "schemas.py"),
    join(backendRoot, "models", "db_models.py"),
  ].map(path => readFileSync(path, "utf8")).join("\n")
  const requestPath = [
    readFileSync(join(process.cwd(), "src", "api", "client.ts"), "utf8"),
    readFileSync(join(backendRoot, "routers", "checkin.py"), "utf8"),
    readFileSync(join(backendRoot, "services", "aggregation.py"), "utf8"),
  ].join("\n")

  assert.equal(/free_text|session_token|dedup:session/i.test(boundaryFiles), false)
  assert.equal(/redis|setex|deduplication|session_token/i.test(requestPath), false)
  assert.equal(/track_click|resource_click|analytics/i.test(requestPath), false)
  assert.equal(/\b(print|logging|logger)\b/i.test(requestPath), false)
})
