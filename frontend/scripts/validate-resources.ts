import { RESOURCE_REGISTRY, expiredResourceRecords, resourceStalenessWarnings, validateResourceRegistry } from "../src/resources/registry.ts"

const errors = validateResourceRegistry(RESOURCE_REGISTRY)
if (errors.length > 0) {
  throw new Error(`Resource validation failed:\n${errors.join("\n")}`)
}

const warnings = resourceStalenessWarnings()
for (const warning of warnings) console.warn(`Resource review warning: ${warning}`)
if (warnings.length > 0 && process.env.RESOURCE_WARNINGS_AS_ERRORS === "true") {
  throw new Error(`Resource review deadlines require action:\n${warnings.join("\n")}`)
}

const expired = expiredResourceRecords()
if (expired.length > 0) {
  throw new Error(`Resource review expired:\n${expired.map(resource => `${resource.id}: expired ${resource.reviewDeadline}; owner ${resource.accountableOwner}; second reviewer ${resource.secondReviewer}`).join("\n")}`)
}

console.log(`Validated ${RESOURCE_REGISTRY.length} resource records with ${warnings.length} review warning(s).`)
