import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const root = join(import.meta.dirname, "..")
const read = (path: string) => readFileSync(join(root, path), "utf8")

test("disabled peer screens do not claim CornellPulse supporters are trained or vetted", () => {
  const source = [
    read("src/pages/PeerPage.tsx"),
    read("src/pages/PeerSignupPage.tsx"),
    read("src/pages/OnboardingPage.tsx"),
  ].join("\n").toLowerCase()
  assert.doesNotMatch(source, /trained cornell|vetted cornell|has been vetted|trained supporter/)
})

test("supporter applications do not collect third-party reference phone or profile data", () => {
  const source = [read("src/pages/PeerPage.tsx"), read("src/pages/PeerSignupPage.tsx")].join("\n")
  assert.doesNotMatch(source, /refPhone|reference phone|refName|refRelationship/)
  assert.match(source, /consent-based reference invitation/i)
})

test("public supporter UI has no phone or email field", () => {
  const source = read("src/pages/PeerPage.tsx")
  const publicType = source.slice(source.indexOf("interface Supporter"), source.indexOf("function avatarColor"))
  assert.doesNotMatch(publicType, /email|phone/)
  assert.doesNotMatch(source, /supporter\.email|supporter\.phone/)
})

test("reference consent route is feature gated and supports explicit decline", () => {
  const app = read("src/App.tsx")
  const reference = read("src/pages/ReferenceInvitationPage.tsx")
  assert.match(app, /path="\/peer\/reference"/)
  assert.match(app, /featureFlags\.supporterSignup \? <ReferenceInvitationPage/)
  assert.match(reference, /consent: false/)
  assert.match(reference, /opening this page did not give consent/i)
  assert.match(reference, /location\.hash/)
  assert.doesNotMatch(reference, /phone number.*input|type="tel"/i)
})
