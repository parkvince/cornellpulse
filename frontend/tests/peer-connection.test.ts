import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const source = readFileSync(new URL("../src/pages/PeerPage.tsx", import.meta.url), "utf8")
const flow = readFileSync(new URL("../../backend/app/services/connection_flow.py", import.meta.url), "utf8")

test("requester flow does not collect or submit direct contact fields", () => {
  const requestModal = source.slice(source.indexOf("function RequestModal"), source.indexOf("interface ManagedConnection"))
  assert.doesNotMatch(requestModal, /requester_email|requester_phone|requester_name/)
  assert.match(requestModal, /requester_consent: true/)
  assert.match(requestModal, /Authorization: `Bearer/)
})

test("request success is shown only after server confirmation", () => {
  assert.match(source, /!response\.ok \|\| data\.status !== "pending" \|\| !data\.request_id/)
  assert.match(source, /setConnectionState\("failed"\)/)
  assert.doesNotMatch(source, /catch \{[^}]*setDone\(true\)/s)
})

test("connection UI covers server states and participant actions", () => {
  for (const state of ["pending", "failed", "declined", "expired", "accepted", "unavailable", "canceled", "blocked"]) {
    assert.match(source, new RegExp(`\\b${state}\\b`))
  }
  for (const action of ["accept", "decline", "expire", "block", "cancel", "report", "messages"]) {
    assert.match(source, new RegExp(action))
  }
})

test("safe meeting registry has no selectable late-night window", () => {
  assert.doesNotMatch(flow, /\{"id":\s*"[^"]*late/i)
  assert.doesNotMatch(source, /"Late nights"/)
  assert.match(flow, /private vehicles/)
})

test("peer features remain disabled by default", () => {
  const envExample = readFileSync(new URL("../../.env.example", import.meta.url), "utf8")
  assert.match(envExample, /^FEATURE_PEER_CONNECT=false$/m)
  assert.match(envExample, /^VITE_FEATURE_PEER_CONNECT=false$/m)
})
