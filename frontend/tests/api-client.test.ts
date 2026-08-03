import assert from "node:assert/strict"
import test from "node:test"

import { ApiError, requestJson, submitAggregateContribution } from "../src/api/client.ts"

const json = (payload: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(payload), {
  status,
  headers: { "Content-Type": "application/json", ...headers },
})

test("safe GET retries a temporary outage and validates the response", async () => {
  let calls = 0
  const fakeFetch: typeof fetch = async () => ++calls === 1 ? json({ detail: "maintenance" }, 503) : json({ status: "ready" })
  const result = await requestJson<{ status: string }>("/health/ready", {
    apiUrl: "https://example.invalid",
    fetchImplementation: fakeFetch,
    retries: 1,
    validate: value => !!value && typeof value === "object" && typeof (value as { status?: unknown }).status === "string",
  })
  assert.equal(result.status, "ready")
  assert.equal(calls, 2)
})

test("mutation failures are never retried or converted to success", async () => {
  let calls = 0
  const fakeFetch: typeof fetch = async () => { calls += 1; return json({ detail: "down" }, 503) }
  await assert.rejects(
    requestJson("/mutation", { method: "POST", body: { ok: true }, apiUrl: "https://example.invalid", fetchImplementation: fakeFetch }),
    (error: unknown) => error instanceof ApiError && error.kind === "maintenance",
  )
  assert.equal(calls, 1)
})

test("invalid successful response shapes fail closed", async () => {
  await assert.rejects(
    requestJson("/shape", { apiUrl: "https://example.invalid", fetchImplementation: async () => json([]), retries: 0, validate: (value): value is { status: string } => !!value && typeof value === "object" && !Array.isArray(value) && "status" in value }),
    (error: unknown) => error instanceof ApiError && error.kind === "invalid_response",
  )
})

test("matching in-flight idempotent mutations submit only once", async () => {
  let calls = 0
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const fakeFetch: typeof fetch = async () => { calls += 1; await gate; return json({ status: "recorded" }) }
  const options = { method: "POST", body: { value: 1 }, idempotencyKey: "same", apiUrl: "https://example.invalid", fetchImplementation: fakeFetch }
  const first = requestJson<{ status: string }>("/mutation", options)
  const second = requestJson<{ status: string }>("/mutation", options)
  release()
  assert.deepEqual(await Promise.all([first, second]), [{ status: "recorded" }, { status: "recorded" }])
  assert.equal(calls, 1)
})

test("aggregate request sends four fields and a separate idempotency header", async () => {
  let body = ""
  let header = ""
  await submitAggregateContribution({ mood_score: 6, sleep_category: "6_to_8", workload_category: "moderate", college: "engineering" }, async (_input, init) => {
    body = String(init?.body)
    header = new Headers(init?.headers).get("X-Idempotency-Key") || ""
    return json({ aggregate_updated: true })
  }, "https://example.invalid/api/v1", "0f19f4a2-c4e4-4d4b-8d8e-c75b34ac63b6")
  assert.deepEqual(Object.keys(JSON.parse(body)).sort(), ["college", "mood_score", "sleep_category", "workload_category"])
  assert.equal(header, "0f19f4a2-c4e4-4d4b-8d8e-c75b34ac63b6")
})
