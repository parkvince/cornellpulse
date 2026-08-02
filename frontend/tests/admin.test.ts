import assert from "node:assert/strict"
import test from "node:test"

import { AdminApiError, adminRequest } from "../src/api/admin.ts"


test("adminRequest always includes browser credentials", async () => {
  let requestInit: RequestInit | undefined
  const fakeFetch: typeof fetch = async (_input, init) => {
    requestInit = init
    return new Response("{}", { status: 200 })
  }

  await adminRequest("https://api.example", "/reports", {}, fakeFetch)
  assert.equal(requestInit?.credentials, "include")
})


test("adminRequest classifies expired sessions", async () => {
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ detail: "expired" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  })

  await assert.rejects(
    adminRequest("https://api.example", "/reports", {}, fakeFetch),
    (error: unknown) => error instanceof AdminApiError && error.kind === "unauthorized" && error.status === 401,
  )
})


test("adminRequest distinguishes rate limits and network failures", async () => {
  const limitedFetch: typeof fetch = async () => new Response(JSON.stringify({ detail: "Try later" }), {
    status: 429,
    headers: { "Content-Type": "application/json" },
  })
  await assert.rejects(
    adminRequest("https://api.example", "/admin/auth/login", {}, limitedFetch),
    (error: unknown) => error instanceof AdminApiError && error.kind === "rate_limited" && error.message === "Try later",
  )

  const offlineFetch: typeof fetch = async () => { throw new TypeError("offline") }
  await assert.rejects(
    adminRequest("https://api.example", "/reports", {}, offlineFetch),
    (error: unknown) => error instanceof AdminApiError && error.kind === "network",
  )
})
