export const RESOURCE_CATEGORIES = ["Cornell", "Crisis", "Community", "Stress Relief", "Physical"] as const
export const RESOURCE_REVIEW_STATUSES = ["verified", "needs_review", "retired"] as const

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number]
export type ResourceReviewStatus = typeof RESOURCE_REVIEW_STATUSES[number]

export interface ResourceTextAction {
  number: string
  prefilledText: string
}

export interface ResourceRecord {
  id: string
  officialName: string
  description: string
  category: ResourceCategory
  eligibility: string
  cost: string
  phone: string | null
  textAction: ResourceTextAction | null
  url: string | null
  location: string
  hours: string
  timezone: string
  accessInstructions: string
  officialSourceUrl: string
  verificationDate: string | null
  verifier: string
  reviewStatus: ResourceReviewStatus
  tags: string[]
}

type PendingResource = Omit<ResourceRecord, "verificationDate" | "verifier" | "reviewStatus">

function pendingResource(resource: PendingResource): ResourceRecord {
  return { ...resource, verificationDate: null, verifier: "Independent source review pending", reviewStatus: "needs_review" }
}

export const RESOURCE_REGISTRY: readonly ResourceRecord[] = [
  {
    id: "emergency_911", officialName: "911 emergency response", description: "Emergency response for an immediate threat to life or a medical, mental health, fire, or safety emergency.", category: "Crisis", eligibility: "Anyone in the United States experiencing or witnessing an immediate emergency.", cost: "Calling is free; costs for dispatched medical services can vary.", phone: "911", textAction: null, url: null, location: "United States", hours: "24/7", timezone: "America/New_York", accessInstructions: "Call 911 for immediate emergency response. CornellPulse cannot dispatch help.", officialSourceUrl: "https://health.cornell.edu/get-care/emergencies-after-hours-care", verificationDate: "2026-08-02", verifier: "CornellPulse official-source review", reviewStatus: "verified", tags: ["crisis", "emergency", "24/7"],
  },
  {
    id: "cornell_public_safety", officialName: "Cornell Public Safety Communications Center", description: "Campus emergency dispatch and public-safety response, including Cornell Police.", category: "Crisis", eligibility: "Cornell community members and visitors needing response on or near the Ithaca campus.", cost: "No charge to call.", phone: "607-255-1111", textAction: null, url: "https://publicsafety.cornell.edu/resources", location: "Cornell Ithaca campus", hours: "24/7", timezone: "America/New_York", accessInstructions: "From a cell phone on the Ithaca campus, call 607-255-1111. Call 911 for an immediate emergency.", officialSourceUrl: "https://publicsafety.cornell.edu/resources", verificationDate: "2026-08-02", verifier: "CornellPulse official-source review", reviewStatus: "verified", tags: ["crisis", "emergency", "on-campus", "24/7"],
  },
  {
    id: "988_lifeline", officialName: "988 Suicide & Crisis Lifeline", description: "Call or text 988 to connect with a trained crisis counselor. Call 911 for an immediate physical safety threat.", category: "Crisis", eligibility: "People in the United States seeking crisis or emotional support.", cost: "No charge from the service; carrier messaging rates may apply.", phone: "988", textAction: { number: "988", prefilledText: "Hello, I need support." }, url: "https://988lifeline.org", location: "Phone, text, or web", hours: "24/7", timezone: "America/New_York", accessInstructions: "Call or text 988, or use the official website for chat options.", officialSourceUrl: "https://988lifeline.org", verificationDate: "2026-08-02", verifier: "CornellPulse official-source review", reviewStatus: "verified", tags: ["crisis", "24/7", "text"],
  },
  {
    id: "cornell_health_247", officialName: "Cornell Health 24/7 phone consultation", description: "Consult with a medical or mental health provider. This is consultation, not emergency dispatch.", category: "Cornell", eligibility: "Cornell students in the United States; confirm current eligibility with Cornell Health.", cost: "Phone consultation is described by Cornell Health as available to students; confirm any follow-up care costs.", phone: "607-255-5155", textAction: null, url: "https://health.cornell.edu/get-care/247-phone-consultation", location: "Phone", hours: "24/7 phone consultation", timezone: "America/New_York", accessInstructions: "Call 607-255-5155 and follow the prompts. Call 911 for a medical or mental health emergency.", officialSourceUrl: "https://health.cornell.edu/get-care/247-phone-consultation", verificationDate: "2026-08-02", verifier: "CornellPulse official-source review", reviewStatus: "verified", tags: ["health", "mental health", "24/7"],
  },
  {
    id: "crisis_text_line", officialName: "Crisis Text Line", description: "Text HOME to 741741 to connect with a volunteer Crisis Counselor.", category: "Crisis", eligibility: "People in the United States seeking text-based crisis support.", cost: "The service describes support as free; message and data rates may apply.", phone: null, textAction: { number: "741741", prefilledText: "HOME" }, url: "https://www.crisistextline.org", location: "Text or web", hours: "24/7", timezone: "America/New_York", accessInstructions: "Text HOME to 741741. The first message may be prefilled on supported devices.", officialSourceUrl: "https://www.crisistextline.org", verificationDate: "2026-08-02", verifier: "CornellPulse official-source review", reviewStatus: "verified", tags: ["crisis", "text", "24/7"],
  },
  {
    id: "cayuga_medical_er", officialName: "Cayuga Medical Center Emergency Department", description: "A hospital emergency department for medical, mental health, and drug- or alcohol-related emergencies.", category: "Crisis", eligibility: "People needing emergency-department care; insurance and costs vary.", cost: "Depends on insurance and services received.", phone: "607-274-4411", textAction: null, url: "https://health.cornell.edu/get-care/emergencies-after-hours-care", location: "101 Dates Drive, Ithaca, NY", hours: "24/7", timezone: "America/New_York", accessInstructions: "No appointment is necessary for emergency-department visits. Call 911 for ambulance transportation in an emergency.", officialSourceUrl: "https://health.cornell.edu/get-care/emergencies-after-hours-care", verificationDate: "2026-08-02", verifier: "CornellPulse official-source review", reviewStatus: "verified", tags: ["crisis", "hospital", "local", "24/7"],
  },
  pendingResource({ id: "caps_access", officialName: "Cornell Health CAPS access appointments", description: "An initial appointment to discuss concerns and explore Cornell Health mental health support options.", category: "Cornell", eligibility: "Cornell students eligible for Cornell Health services; confirm current eligibility.", cost: "Confirm current fees with Cornell Health.", phone: "607-255-5155", textAction: null, url: "https://health.cornell.edu/services/mental-health-care/access", location: "Cornell Health or remote, depending on current options", hours: "Current availability varies", timezone: "America/New_York", accessInstructions: "Use myCornellHealth or call during business hours to ask about an access appointment.", officialSourceUrl: "https://health.cornell.edu/services/mental-health-care/access", tags: ["therapy", "mental health"] }),
  pendingResource({ id: "lets_talk", officialName: "Let's Talk Drop-In Consultation", description: "Informal consultation with a Cornell Health counselor; it is not a substitute for emergency care.", category: "Cornell", eligibility: "Cornell students; schedules and locations change.", cost: "Confirm current cost and eligibility on the official page.", phone: null, textAction: null, url: "https://health.cornell.edu/services/mental-health-care/lets-talk", location: "Locations and remote options vary", hours: "Check the official current schedule", timezone: "America/New_York", accessInstructions: "Review the current schedule and participation instructions on the official page.", officialSourceUrl: "https://health.cornell.edu/services/mental-health-care/lets-talk", tags: ["drop-in", "mental health"] }),
  pendingResource({ id: "ears", officialName: "EARS", description: "A Cornell student peer-support organization; confirm current services, training language, and operating status before use.", category: "Cornell", eligibility: "Confirm current eligibility with EARS.", cost: "Confirm with EARS.", phone: "607-255-4050", textAction: null, url: "https://ears.cornell.edu", location: "Confirm current location", hours: "Check the official site", timezone: "America/New_York", accessInstructions: "Review the official site before visiting or calling.", officialSourceUrl: "https://ears.cornell.edu", tags: ["peer", "talk"] }),
  pendingResource({ id: "learning_strategies", officialName: "Learning Strategies Center", description: "Academic support, study strategies, and learning resources.", category: "Cornell", eligibility: "Cornell students; program eligibility varies.", cost: "Varies by program; review the official site.", phone: null, textAction: null, url: "https://lsc.cornell.edu", location: "Cornell Ithaca campus and online", hours: "Varies by program", timezone: "America/New_York", accessInstructions: "Review current programs and participation instructions online.", officialSourceUrl: "https://lsc.cornell.edu", tags: ["academics", "learning"] }),
  pendingResource({ id: "basic_needs", officialName: "Cornell Basic Needs", description: "Information and support related to food, housing, finances, and other essential needs.", category: "Cornell", eligibility: "Eligibility varies by service.", cost: "Varies by service.", phone: null, textAction: null, url: "https://basicneeds.cornell.edu", location: "Multiple Cornell services", hours: "Varies by service", timezone: "America/New_York", accessInstructions: "Use the official site to identify the relevant current service and eligibility requirements.", officialSourceUrl: "https://basicneeds.cornell.edu", tags: ["food", "housing", "financial"] }),
  pendingResource({ id: "identity_support", officialName: "Cornell identity and belonging resources", description: "Cornell community and support resources related to identity and belonging.", category: "Cornell", eligibility: "Varies by office and program.", cost: "Varies by program.", phone: null, textAction: null, url: "https://scl.cornell.edu/identity-resources", location: "Multiple Cornell offices", hours: "Varies by office", timezone: "America/New_York", accessInstructions: "Use the official directory to choose and verify a specific office or program.", officialSourceUrl: "https://scl.cornell.edu/identity-resources", tags: ["identity", "belonging", "lgbtq"] }),
  pendingResource({ id: "financial_aid_emergency_fund", officialName: "Cornell financial aid emergency funding", description: "Official information about emergency funding options for eligible Cornell students.", category: "Cornell", eligibility: "Eligibility and available funding vary; confirm on the official page.", cost: "Not applicable; terms vary by funding source.", phone: "607-255-5145", textAction: null, url: "https://finaid.cornell.edu/emergency-fund", location: "Cornell Office of Financial Aid", hours: "Check the official page", timezone: "America/New_York", accessInstructions: "Review eligibility and application instructions on the official page before relying on availability.", officialSourceUrl: "https://finaid.cornell.edu/emergency-fund", tags: ["financial", "emergency"] }),
  pendingResource({ id: "cornell_botanic_gardens", officialName: "Cornell Botanic Gardens", description: "Gardens, natural areas, and trails operated by Cornell Botanic Gardens.", category: "Stress Relief", eligibility: "Public access varies by location and conditions.", cost: "Check the official site for current admission or parking information.", phone: null, textAction: null, url: "https://cornellbotanicgardens.org", location: "Cornell Botanic Gardens and natural areas", hours: "Check seasonal hours and notices", timezone: "America/New_York", accessInstructions: "Review current hours, closures, accessibility, and safety notices before visiting.", officialSourceUrl: "https://cornellbotanicgardens.org", tags: ["nature", "outdoor", "local"] }),
  pendingResource({ id: "helen_newman_fitness", officialName: "Helen Newman Hall fitness facilities", description: "Cornell recreation and fitness facilities at Helen Newman Hall.", category: "Physical", eligibility: "Membership and access rules vary.", cost: "Membership or activity fees may apply.", phone: null, textAction: null, url: "https://recreation.athletics.cornell.edu/facilities/helen-newman", location: "Helen Newman Hall, Cornell Ithaca campus", hours: "Check current facility hours", timezone: "America/New_York", accessInstructions: "Confirm access, membership, hours, and closures on the official page.", officialSourceUrl: "https://recreation.athletics.cornell.edu/facilities/helen-newman", tags: ["fitness", "physical", "local"] }),
] as const

export const ACTIVE_RESOURCES = RESOURCE_REGISTRY.filter(resource => resource.reviewStatus !== "retired")
export const RESOURCE_BY_ID = new Map(RESOURCE_REGISTRY.map(resource => [resource.id, resource]))

export function getResource(id: string): ResourceRecord {
  const resource = RESOURCE_BY_ID.get(id)
  if (!resource) throw new Error(`Unknown resource ID: ${id}`)
  return resource
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function validateResourceRegistry(records: readonly ResourceRecord[] = RESOURCE_REGISTRY): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const [index, resource] of records.entries()) {
    const prefix = `resource[${index}]${resource?.id ? ` (${resource.id})` : ""}`
    if (!resource || typeof resource !== "object") { errors.push(`${prefix}: record must be an object`); continue }
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(resource.id)) errors.push(`${prefix}: id must be a stable snake_case identifier`)
    if (ids.has(resource.id)) errors.push(`${prefix}: duplicate id`)
    ids.add(resource.id)
    for (const field of ["officialName", "description", "eligibility", "cost", "location", "hours", "timezone", "accessInstructions", "officialSourceUrl", "verifier"] as const) {
      if (typeof resource[field] !== "string" || !resource[field].trim()) errors.push(`${prefix}: ${field} is required`)
    }
    if (!RESOURCE_CATEGORIES.includes(resource.category)) errors.push(`${prefix}: invalid category`)
    if (!RESOURCE_REVIEW_STATUSES.includes(resource.reviewStatus)) errors.push(`${prefix}: invalid reviewStatus`)
    if (!isHttpUrl(resource.officialSourceUrl)) errors.push(`${prefix}: officialSourceUrl must be an HTTP(S) URL`)
    if (resource.url !== null && !isHttpUrl(resource.url)) errors.push(`${prefix}: url must be null or an HTTP(S) URL`)
    if (resource.phone !== null && !/^[0-9-]+$/.test(resource.phone)) errors.push(`${prefix}: phone has an invalid format`)
    if (resource.textAction && (!/^[0-9]+$/.test(resource.textAction.number) || !resource.textAction.prefilledText.trim())) errors.push(`${prefix}: malformed textAction`)
    if (!Array.isArray(resource.tags) || resource.tags.length === 0 || resource.tags.some(tag => typeof tag !== "string" || !tag.trim())) errors.push(`${prefix}: tags must contain non-empty strings`)
    try { new Intl.DateTimeFormat("en-US", { timeZone: resource.timezone }).format() } catch { errors.push(`${prefix}: invalid IANA timezone`) }
    if (resource.verificationDate !== null) {
      const dateMatches = /^\d{4}-\d{2}-\d{2}$/.test(resource.verificationDate)
      const parsedDate = dateMatches ? new Date(`${resource.verificationDate}T00:00:00Z`) : null
      if (!dateMatches || !parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== resource.verificationDate) errors.push(`${prefix}: verificationDate must be a real YYYY-MM-DD date or null`)
    }
    if (resource.reviewStatus === "verified" && resource.verificationDate === null) errors.push(`${prefix}: verified records require verificationDate`)
    if (resource.reviewStatus === "needs_review" && resource.verificationDate !== null) errors.push(`${prefix}: needs_review records must not imply a completed verification`)
    if (!resource.phone && !resource.textAction && !resource.url) errors.push(`${prefix}: at least one contact or access action is required`)
  }
  return errors
}

const registryErrors = validateResourceRegistry()
if (registryErrors.length > 0) throw new Error(`Invalid resource registry:\n${registryErrors.join("\n")}`)
