import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

test("public safety-sensitive UI cannot be enabled by environment flags alone", () => {
  const source = readFileSync(join(process.cwd(), "src", "config", "featureFlags.ts"), "utf8")
  assert.match(source, /peerConnect:\s*false/)
  assert.match(source, /supporterSignup:\s*false/)
  assert.match(source, /publicAdmin:\s*false/)
  assert.match(source, /enabled\(import\.meta\.env\.VITE_FEATURE_PEER_CONNECT\) && localReleaseApprovals\.peerConnect/)
  assert.match(source, /enabled\(import\.meta\.env\.VITE_FEATURE_SUPPORTER_SIGNUP\) && localReleaseApprovals\.supporterSignup/)
  assert.match(source, /enabled\(import\.meta\.env\.VITE_FEATURE_PUBLIC_ADMIN\) && localReleaseApprovals\.publicAdmin/)
})

test("default environment examples keep every public safety-sensitive flag off", () => {
  const env = readFileSync(join(process.cwd(), "..", ".env.example"), "utf8")
  for (const flag of ["FEATURE_PEER_CONNECT", "FEATURE_SUPPORTER_SIGNUP", "VITE_FEATURE_PEER_CONNECT", "VITE_FEATURE_SUPPORTER_SIGNUP", "VITE_FEATURE_PUBLIC_ADMIN"]) {
    assert.match(env, new RegExp(`^${flag}=false$`, "m"))
  }
})
