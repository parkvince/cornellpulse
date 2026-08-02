import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { submitAggregateContribution } from "../src/api/client.ts"
import { buildLocalRecommendation } from "../src/checkin/localRecommendations.ts"

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
  assert.equal(result.triage_result.crisis_flag, true)

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
