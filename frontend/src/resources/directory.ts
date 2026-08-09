import type {
  AppointmentRequirement,
  ResourceCategory,
  ResourceCostType,
  ResourceEligibilityGroup,
  ResourceModality,
  ResourceRecord,
  ResourceScope,
  ResourceUrgency,
  Weekday,
  WeeklyHoursInterval,
} from "./registry.ts"

export type AvailabilityStatus = "open" | "closed" | "unknown"

export interface ResourceFilters {
  cost?: ResourceCostType
  urgency?: ResourceUrgency
  eligibility?: ResourceEligibilityGroup
  modality?: ResourceModality
  scope?: ResourceScope
  appointment?: AppointmentRequirement
  category?: ResourceCategory
  openNow?: boolean
}

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
const SHORT_WEEKDAY: Record<string, Weekday> = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" }

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || ""
  const weekday = SHORT_WEEKDAY[value("weekday")]
  if (!weekday) throw new Error(`Could not determine weekday in ${timeZone}`)
  return {
    weekday,
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minute: Number(value("hour")) * 60 + Number(value("minute")),
  }
}

function timeToMinute(value: string): number {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function intervalIsOpen(interval: WeeklyHoursInterval, weekday: Weekday, minute: number): boolean {
  const start = timeToMinute(interval.start)
  const end = timeToMinute(interval.end)
  if (end > start) return interval.days.includes(weekday) && minute >= start && minute < end
  const previousWeekday = WEEKDAYS[(WEEKDAYS.indexOf(weekday) + 6) % 7]
  return (interval.days.includes(weekday) && minute >= start) || (interval.days.includes(previousWeekday) && minute < end)
}

export function getAvailability(resource: ResourceRecord, now = new Date()): AvailabilityStatus {
  if (resource.availability.kind === "always") return "open"
  if (resource.availability.kind === "variable") return "unknown"

  const local = zonedParts(now, resource.timezone)
  const override = resource.availability.overrides?.find(period => local.date >= period.from && local.date <= period.through)
  const intervals = override?.intervals ?? resource.availability.intervals
  return intervals.some(interval => intervalIsOpen(interval, local.weekday, local.minute)) ? "open" : "closed"
}

export function isResourceStale(resource: ResourceRecord, now = new Date()): boolean {
  if (!resource.verificationDate || resource.reviewStatus !== "verified") return true
  return resource.reviewDeadline < now.toISOString().slice(0, 10)
}

function includesSearch(resource: ResourceRecord, search: string): boolean {
  const query = search.trim().toLocaleLowerCase()
  if (!query) return true
  return [
    resource.officialName,
    resource.description,
    resource.eligibility,
    resource.cost,
    resource.location,
    resource.accessInstructions,
    resource.whatHappensNext,
    resource.category,
    ...resource.tags,
    ...resource.modalities,
  ].some(value => value.toLocaleLowerCase().includes(query))
}

export function filterResources(
  resources: readonly ResourceRecord[],
  search = "",
  filters: ResourceFilters = {},
  now = new Date(),
): ResourceRecord[] {
  return resources.filter(resource =>
    includesSearch(resource, search) &&
    (!filters.cost || resource.costType === filters.cost) &&
    (!filters.urgency || resource.urgency === filters.urgency) &&
    (!filters.eligibility || resource.eligibilityGroups.includes(filters.eligibility)) &&
    (!filters.modality || resource.modalities.includes(filters.modality)) &&
    (!filters.scope || resource.scope === filters.scope) &&
    (!filters.appointment || resource.appointmentRequirement === filters.appointment) &&
    (!filters.category || resource.category === filters.category) &&
    (!filters.openNow || getAvailability(resource, now) === "open")
  )
}

export function resourcePath(resourceOrId: ResourceRecord | string): string {
  return `/resources/${typeof resourceOrId === "string" ? resourceOrId : resourceOrId.id}`
}

export function callHref(resource: ResourceRecord): string | undefined {
  return resource.phone ? `tel:${resource.phone.replace(/-/g, "")}` : undefined
}

export function textHref(resource: ResourceRecord): string | undefined {
  if (!resource.textAction) return undefined
  return `sms:${resource.textAction.number}?body=${encodeURIComponent(resource.textAction.prefilledText)}`
}
