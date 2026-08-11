import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const peer = readFileSync(join(process.cwd(), "src", "pages", "PeerPage.tsx"), "utf8")
const privacy = readFileSync(join(process.cwd(), "src", "pages", "PrivacyPage.tsx"), "utf8")
const backendConfig = readFileSync(join(process.cwd(), "..", "backend", "app", "config.py"), "utf8")
const backendAuth = readFileSync(join(process.cwd(), "..", "backend", "app", "auth.py"), "utf8")

test("open Peer sandbox labels every identity as unverified", () => {
  assert.match(peer, /Cornell identity verification coming soon/)
  assert.match(peer, /Anyone can create an account/)
  assert.match(peer, /Identity not verified/)
  assert.doesNotMatch(peer, /fictional|simulation only/i)
  assert.match(privacy, /open non-production sandbox/)
})

test("sandbox exposes real requester, supporter, discovery, and management paths", () => {
  assert.match(peer, /Create requester account/)
  assert.match(peer, /Become a supporter/)
  assert.match(peer, /\/peer\/requesters/)
  assert.match(peer, /\/peer-signup/)
  assert.match(peer, /\/peer-supporters/)
  assert.match(peer, /Manage connection requests/)
})

test("sandbox secrets remain local and production rejects sandbox mode", () => {
  assert.match(backendConfig, /\.peer-sandbox-secrets\.json/)
  assert.match(backendConfig, /if not settings\.PEER_SANDBOX_MODE or settings\.is_production/)
  assert.match(backendAuth, /PEER_SANDBOX_MODE is prohibited in production/)
})
