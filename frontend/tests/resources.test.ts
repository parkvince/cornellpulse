import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { ACTIVE_RESOURCES, RESOURCE_REGISTRY, getResource, validateResourceRegistry, type ResourceRecord } from "../src/resources/registry.ts"

test("resource registry satisfies the runtime schema", () => {
  assert.deepEqual(validateResourceRegistry(), [])
  assert.equal(RESOURCE_REGISTRY.length, 15)
  assert.equal(new Set(RESOURCE_REGISTRY.map(resource => resource.id)).size, RESOURCE_REGISTRY.length)
})

test("malformed and duplicate records are rejected", () => {
  const valid = getResource("988_lifeline")
  const malformed = {
    ...valid,
    id: "Not Stable",
    officialName: "",
    officialSourceUrl: "javascript:alert(1)",
    timezone: "Not/A_Timezone",
    reviewStatus: "verified",
    verificationDate: "2026-99-99",
    textAction: { number: "text-me", prefilledText: "" },
  } as unknown as ResourceRecord
  const errors = validateResourceRegistry([valid, valid, malformed])
  assert.ok(errors.some(error => error.includes("duplicate id")))
  assert.ok(errors.some(error => error.includes("stable snake_case")))
  assert.ok(errors.some(error => error.includes("officialName is required")))
  assert.ok(errors.some(error => error.includes("officialSourceUrl")))
  assert.ok(errors.some(error => error.includes("invalid IANA timezone")))
  assert.ok(errors.some(error => error.includes("real YYYY-MM-DD")))
  assert.ok(errors.some(error => error.includes("malformed textAction")))
})

test("verification claims agree with review status", () => {
  for (const resource of RESOURCE_REGISTRY) {
    if (resource.reviewStatus === "verified") {
      assert.match(resource.verificationDate || "", /^\d{4}-\d{2}-\d{2}$/)
      assert.notEqual(resource.verifier, "Independent source review pending")
    } else if (resource.reviewStatus === "needs_review") {
      assert.equal(resource.verificationDate, null)
      assert.equal(resource.verifier, "Independent source review pending")
    }
  }
  assert.ok(ACTIVE_RESOURCES.every(resource => resource.reviewStatus !== "retired"))
  assert.ok(ACTIVE_RESOURCES.every(resource => resource.reviewStatus === "verified"))
  assert.ok(ACTIVE_RESOURCES.every(resource => resource.verificationDate === "2026-08-03"))
})

test("all resource consumers use the registry instead of duplicate arrays", () => {
  const files = [
    join(process.cwd(), "src", "pages", "ResourcesPage.tsx"),
    join(process.cwd(), "src", "pages", "HomePage.tsx"),
    join(process.cwd(), "src", "checkin", "localRecommendations.ts"),
    join(process.cwd(), "src", "components", "shared", "EmergencyHelp.tsx"),
  ]
  const sources = files.map(path => readFileSync(path, "utf8"))
  for (const source of sources) assert.match(source, /resources\/registry/)
  assert.equal(sources.some(source => /const\s+(?:resources|RESOURCES)\s*=\s*(?:\[|\{)/.test(source)), false)
})

test("resource UI exposes verification status and official sources", () => {
  const resourcesPage = readFileSync(join(process.cwd(), "src", "pages", "ResourcesPage.tsx"), "utf8")
  const resourceDetailPage = readFileSync(join(process.cwd(), "src", "pages", "ResourceDetailPage.tsx"), "utf8")
  const resultCard = readFileSync(join(process.cwd(), "src", "components", "checkin", "ResultCard.tsx"), "utf8")
  assert.match(resourcesPage, /Last verified/)
  assert.match(resourceDetailPage, /official source/i)
  assert.match(resourcesPage, /ACTIVE_RESOURCES\.length} verified resources/)
  assert.match(resultCard, /Last verified/)
})

test("audited registry excludes stale links and unsupported claims", () => {
  const serialized = JSON.stringify(RESOURCE_REGISTRY).toLowerCase()
  for (const stale of [
    "ears.cornell.edu",
    "recreation.athletics.cornell.edu",
    "finaid.cornell.edu/emergency-fund\"",
    "scl.cornell.edu/identity-resources",
    "headspace",
    "no questions asked",
    "every option",
    "guaranteed wait",
  ]) assert.equal(serialized.includes(stale), false, `stale or unsupported resource content returned: ${stale}`)

  assert.equal(getResource("ears").officialName, "EARS Peer Mentoring")
  assert.equal(getResource("identity_support").officialName, "Cornell LGBT Resource Center")
  assert.equal(getResource("basic_needs").officialName, "Cornell Food Pantry")
  assert.match(getResource("helen_newman_fitness").cost, /Not universally free/)
})
