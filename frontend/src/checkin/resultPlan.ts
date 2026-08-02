import type { QualifiedResourceOption } from "./localRecommendations"
import type { ResourceRecord } from "../resources/registry.ts"
import { savePlanEntry, type LocalPlanEntry } from "../history/localHistory.ts"

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export function isUsableResultResource(value: unknown): value is ResourceRecord {
  if (!value || typeof value !== "object") return false
  const resource = value as Partial<ResourceRecord>
  return typeof resource.id === "string" && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(resource.id)
    && typeof resource.officialName === "string" && resource.officialName.trim().length > 0
    && typeof resource.description === "string" && resource.description.trim().length > 0
    && typeof resource.cost === "string" && resource.cost.trim().length > 0
    && typeof resource.eligibility === "string" && resource.eligibility.trim().length > 0
    && typeof resource.hours === "string" && resource.hours.trim().length > 0
    && typeof resource.verificationDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(resource.verificationDate)
    && resource.reviewStatus === "verified"
    && isHttpUrl(resource.officialSourceUrl)
}

export function prepareResultOptions(options: readonly QualifiedResourceOption[]): QualifiedResourceOption[] {
  const ids = new Set<string>()
  return options.filter(option => {
    if (!option || typeof option.why !== "string" || !option.why.trim() || !isUsableResultResource(option.resource)) return false
    if (ids.has(option.resource.id)) return false
    ids.add(option.resource.id)
    return true
  }).slice(0, 3)
}

export function directionsHref(resource: ResourceRecord): string | undefined {
  if (!resource.modalities.includes("in_person") || !resource.location.trim()) return undefined
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.location)}`
}

export function bookingHref(resource: ResourceRecord): string | undefined {
  return resource.appointmentRequirement === "required" && isHttpUrl(resource.url) ? resource.url : undefined
}

export function saveLocalPlan(
  checkinId: string,
  mood: number,
  resource: ResourceRecord,
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
  now = new Date(),
): LocalPlanEntry {
  const entry = { id: checkinId, date: now.toISOString(), mood, resource: resource.officialName, resourceId: resource.id }
  return savePlanEntry(entry, storage, now)
}
