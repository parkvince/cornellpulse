import { RESOURCE_REGISTRY, validateResourceRegistry } from "../src/resources/registry.ts"

const errors = validateResourceRegistry(RESOURCE_REGISTRY)
if (errors.length > 0) {
  throw new Error(`Resource validation failed:\n${errors.join("\n")}`)
}

console.log(`Validated ${RESOURCE_REGISTRY.length} resource records.`)
