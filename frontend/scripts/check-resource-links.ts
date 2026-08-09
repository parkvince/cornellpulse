import { ACTIVE_RESOURCES } from "../src/resources/registry.ts"

const TIMEOUT_MS = 8_000
const failures: string[] = []
const manualVerificationWarnings: string[] = []
const requestHeaders = {
  "User-Agent": "CornellPulse-resource-maintenance/1.0 (+link integrity check)",
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
}

async function checkLink(resourceId: string, url: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: requestHeaders })
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { ...requestHeaders, Range: "bytes=0-0" } })
    }
    if ([401, 403, 406, 429].includes(response.status)) {
      manualVerificationWarnings.push(`${resourceId}: HTTP ${response.status}; host blocks or limits automation (${new URL(url).hostname})`)
    } else if (!response.ok) {
      failures.push(`${resourceId}: HTTP ${response.status} (${new URL(url).hostname})`)
    }
  } catch (error) {
    failures.push(`${resourceId}: ${error instanceof Error && error.name === "AbortError" ? "timeout" : "network failure"} (${new URL(url).hostname})`)
  } finally {
    clearTimeout(timer)
  }
}

const links = new Map<string, { resourceIds: string[]; url: string }>()
for (const resource of ACTIVE_RESOURCES) {
  for (const url of [resource.officialSourceUrl, resource.url].filter((value): value is string => Boolean(value))) {
    const existing = links.get(url)
    if (existing) existing.resourceIds.push(resource.id)
    else links.set(url, { resourceIds: [resource.id], url })
  }
}

await Promise.all([...links.values()].map(link => checkLink(link.resourceIds.join(","), link.url)))
if (failures.length) throw new Error(`Official resource link check failed:\n${failures.join("\n")}`)
for (const warning of manualVerificationWarnings) console.warn(`Manual source check required: ${warning}`)
console.log(`Checked ${links.size} unique official and direct-action resource links for ${ACTIVE_RESOURCES.length} records; ${manualVerificationWarnings.length} host(s) require documented manual verification.`)
