export const RESOURCE_CATEGORIES = ["Cornell", "Crisis", "Community", "Stress Relief", "Physical"] as const
export const RESOURCE_REVIEW_STATUSES = ["verified", "needs_review", "retired"] as const

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number]
export type ResourceReviewStatus = typeof RESOURCE_REVIEW_STATUSES[number]
export type ResourceCostType = "free" | "paid" | "varies"
export type ResourceUrgency = "emergency" | "urgent" | "routine"
export type ResourceEligibilityGroup = "anyone" | "cornell_student" | "cornell_community"
export type ResourceModality = "phone" | "text" | "online" | "in_person"
export type ResourceScope = "campus" | "community" | "national"
export type AppointmentRequirement = "required" | "not_required" | "varies"
export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

export interface WeeklyHoursInterval {
  days: Weekday[]
  start: string
  end: string
}

export interface DatedHoursOverride {
  from: string
  through: string
  intervals: WeeklyHoursInterval[]
}

export type ResourceAvailability =
  | { kind: "always" }
  | { kind: "weekly"; intervals: WeeklyHoursInterval[]; overrides?: DatedHoursOverride[] }
  | { kind: "variable" }

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
  whatHappensNext: string
  costType: ResourceCostType
  urgency: ResourceUrgency
  eligibilityGroups: ResourceEligibilityGroup[]
  modalities: ResourceModality[]
  scope: ResourceScope
  appointmentRequirement: AppointmentRequirement
  availability: ResourceAvailability
  officialSourceUrl: string
  verificationDate: string | null
  verifier: string
  reviewStatus: ResourceReviewStatus
  tags: string[]
}

type ResourceDecisionMetadata = Pick<ResourceRecord, "whatHappensNext" | "costType" | "urgency" | "eligibilityGroups" | "modalities" | "scope" | "appointmentRequirement" | "availability">
type VerifiedResource = Omit<ResourceRecord, "verificationDate" | "verifier" | "reviewStatus" | keyof ResourceDecisionMetadata>

const RESOURCE_DECISIONS: Record<string, ResourceDecisionMetadata> = {
  emergency_911: { whatHappensNext: "A dispatcher asks where you are and what is happening, then sends the appropriate emergency response.", costType: "free", urgency: "emergency", eligibilityGroups: ["anyone"], modalities: ["phone"], scope: "national", appointmentRequirement: "not_required", availability: { kind: "always" } },
  cornell_public_safety: { whatHappensNext: "A Cornell dispatcher assesses the situation and coordinates campus police, fire, medical, or other public-safety response.", costType: "free", urgency: "emergency", eligibilityGroups: ["cornell_community"], modalities: ["phone"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "always" } },
  "988_lifeline": { whatHappensNext: "A trained crisis counselor responds by phone, text, or chat to listen, assess immediate safety, and help identify next steps.", costType: "free", urgency: "urgent", eligibilityGroups: ["anyone"], modalities: ["phone", "text", "online"], scope: "national", appointmentRequirement: "not_required", availability: { kind: "always" } },
  cornell_health_247: { whatHappensNext: "The phone menu connects you with a medical or mental health provider for consultation and guidance about appropriate follow-up.", costType: "varies", urgency: "urgent", eligibilityGroups: ["cornell_student"], modalities: ["phone"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "always" } },
  crisis_text_line: { whatHappensNext: "An automated response confirms receipt, then a volunteer Crisis Counselor joins the text conversation and helps you work toward a safer next step.", costType: "free", urgency: "urgent", eligibilityGroups: ["anyone"], modalities: ["text", "online"], scope: "national", appointmentRequirement: "not_required", availability: { kind: "always" } },
  cayuga_medical_er: { whatHappensNext: "Emergency Department staff triage the immediate concern and determine evaluation, treatment, observation, or referral needs.", costType: "varies", urgency: "emergency", eligibilityGroups: ["anyone"], modalities: ["phone", "in_person"], scope: "community", appointmentRequirement: "not_required", availability: { kind: "always" } },
  caps_access: { whatHappensNext: "A CAPS clinician spends about 20 minutes discussing your concern and recommends suitable Cornell Health or outside options; this visit is not counseling.", costType: "free", urgency: "routine", eligibilityGroups: ["cornell_student"], modalities: ["phone", "online", "in_person"], scope: "campus", appointmentRequirement: "required", availability: { kind: "variable" } },
  lets_talk: { whatHappensNext: "A counselor offers a brief informal consultation and may suggest services or next steps; it does not create an ongoing counseling relationship.", costType: "free", urgency: "routine", eligibilityGroups: ["cornell_student"], modalities: ["online", "in_person"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "variable" } },
  ears: { whatHappensNext: "A trained student peer mentor listens informally, offers support, and may point you toward relevant professional or campus resources.", costType: "free", urgency: "routine", eligibilityGroups: ["cornell_student"], modalities: ["in_person"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "variable" } },
  learning_strategies: { whatHappensNext: "You choose the relevant tutoring, course, workshop, or study-skills program and follow that program’s current participation instructions.", costType: "varies", urgency: "routine", eligibilityGroups: ["cornell_student"], modalities: ["online", "in_person"], scope: "campus", appointmentRequirement: "varies", availability: { kind: "variable" } },
  basic_needs: { whatHappensNext: "After enrollment and completion of the required state form, you visit during open hours and select available items within current limits.", costType: "free", urgency: "routine", eligibilityGroups: ["cornell_community"], modalities: ["online", "in_person"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "weekly", intervals: [{ days: ["tue", "thu"], start: "16:00", end: "19:00" }, { days: ["wed", "fri"], start: "10:00", end: "13:00" }, { days: ["sun"], start: "12:00", end: "15:00" }], overrides: [{ from: "2026-05-26", through: "2026-08-16", intervals: [{ days: ["tue", "thu"], start: "15:00", end: "19:00" }, { days: ["wed", "fri"], start: "10:00", end: "13:00" }] }] } },
  identity_support: { whatHappensNext: "Staff can answer questions, connect you with programs, or help identify relevant campus support; program-specific follow-up varies.", costType: "free", urgency: "routine", eligibilityGroups: ["cornell_community"], modalities: ["phone", "online", "in_person"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "weekly", intervals: [{ days: ["mon", "tue", "wed", "thu", "fri"], start: "09:00", end: "17:00" }] } },
  financial_aid_emergency_fund: { whatHappensNext: "Financial Aid reviews the submitted application and documentation against available fund criteria; an application does not guarantee an award.", costType: "free", urgency: "routine", eligibilityGroups: ["cornell_student"], modalities: ["phone", "online", "in_person"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "weekly", intervals: [{ days: ["mon", "tue", "wed", "thu", "fri"], start: "10:00", end: "13:00" }, { days: ["mon", "tue", "wed", "thu", "fri"], start: "14:00", end: "16:00" }] } },
  cornell_botanic_gardens: { whatHappensNext: "You plan your own visit; the official visitor information provides current parking, accessibility, seasonal hours, and closure notices.", costType: "free", urgency: "routine", eligibilityGroups: ["anyone"], modalities: ["in_person"], scope: "community", appointmentRequirement: "not_required", availability: { kind: "variable" } },
  helen_newman_fitness: { whatHappensNext: "You confirm the activity’s current schedule and access requirement, then present the required Cornell ID, membership, or pass at the facility.", costType: "paid", urgency: "routine", eligibilityGroups: ["cornell_community"], modalities: ["in_person"], scope: "campus", appointmentRequirement: "not_required", availability: { kind: "variable" } },
}

function verifiedResource(resource: VerifiedResource): ResourceRecord {
  const decisionMetadata = RESOURCE_DECISIONS[resource.id]
  if (!decisionMetadata) throw new Error(`Missing decision metadata for resource: ${resource.id}`)
  return {
    ...resource,
    ...decisionMetadata,
    verificationDate: "2026-08-03",
    verifier: "CornellPulse official-source review",
    reviewStatus: "verified",
  }
}

export const RESOURCE_REGISTRY: readonly ResourceRecord[] = [
  verifiedResource({
    id: "emergency_911", officialName: "911 emergency response", description: "Emergency response for an immediate threat to life or a medical, mental health, fire, or safety emergency.", category: "Crisis", eligibility: "Anyone in the United States experiencing or witnessing an immediate emergency.", cost: "Calling is free; costs for dispatched medical services can vary.", phone: "911", textAction: null, url: null, location: "United States", hours: "24/7", timezone: "America/New_York", accessInstructions: "Call 911 for immediate emergency response. CornellPulse cannot dispatch help.", officialSourceUrl: "https://health.cornell.edu/get-care/emergencies-after-hours-care", tags: ["crisis", "emergency", "24/7"],
  }),
  verifiedResource({
    id: "cornell_public_safety", officialName: "Cornell Public Safety Communications Center", description: "Campus emergency dispatch and public-safety response, including Cornell Police.", category: "Crisis", eligibility: "Cornell community members and visitors needing response on or near the Ithaca campus.", cost: "No charge to call.", phone: "607-255-1111", textAction: null, url: "https://publicsafety.cornell.edu/resources", location: "Cornell Ithaca campus", hours: "24/7", timezone: "America/New_York", accessInstructions: "From a cell phone on the Ithaca campus, call 607-255-1111. Call 911 for an immediate emergency.", officialSourceUrl: "https://publicsafety.cornell.edu/resources", tags: ["crisis", "emergency", "on-campus", "24/7"],
  }),
  verifiedResource({
    id: "988_lifeline", officialName: "988 Suicide & Crisis Lifeline", description: "Call or text 988 to connect with a trained crisis counselor. Call 911 for an immediate physical safety threat.", category: "Crisis", eligibility: "People in the United States seeking crisis or emotional support.", cost: "The 988 Lifeline is free; wireless carrier terms may still apply.", phone: "988", textAction: { number: "988", prefilledText: "Hello, I need support." }, url: "https://988lifeline.org", location: "Phone, text, or web", hours: "24/7", timezone: "America/New_York", accessInstructions: "Call or text 988, or use the official website for chat options.", officialSourceUrl: "https://988lifeline.org", tags: ["crisis", "24/7", "text"],
  }),
  verifiedResource({
    id: "cornell_health_247", officialName: "Cornell Health 24/7 phone consultation", description: "Consult with a medical or mental health provider. This is consultation, not emergency dispatch.", category: "Cornell", eligibility: "Cornell students located within the United States.", cost: "Cornell Health does not list a charge for the phone consultation; follow-up care may have costs.", phone: "607-255-5155", textAction: null, url: "https://health.cornell.edu/get-care/247-phone-consultation", location: "Phone", hours: "24/7 phone consultation", timezone: "America/New_York", accessInstructions: "Call 607-255-5155 and follow the prompts. Call 911 for a medical or mental health emergency.", officialSourceUrl: "https://health.cornell.edu/get-care/247-phone-consultation", tags: ["health", "mental health", "24/7"],
  }),
  verifiedResource({
    id: "crisis_text_line", officialName: "Crisis Text Line", description: "Text HOME to 741741 to connect with a volunteer Crisis Counselor.", category: "Crisis", eligibility: "People in the United States seeking text-based crisis support.", cost: "The service is free; message and data rates may apply.", phone: null, textAction: { number: "741741", prefilledText: "HOME" }, url: "https://www.crisistextline.org", location: "Text or web", hours: "24/7", timezone: "America/New_York", accessInstructions: "Text HOME to 741741. The first message may be prefilled on supported devices.", officialSourceUrl: "https://www.crisistextline.org", tags: ["crisis", "text", "24/7"],
  }),
  verifiedResource({
    id: "cayuga_medical_er", officialName: "Cayuga Medical Center Emergency Department", description: "A hospital emergency department for medical, mental health, and drug- or alcohol-related emergencies.", category: "Crisis", eligibility: "People needing emergency-department care; insurance and costs vary.", cost: "Depends on insurance and services received.", phone: "607-274-4411", textAction: null, url: "https://cayugahealth.org/contact/cayuga-medical-center/", location: "101 Dates Drive, Ithaca, NY 14850", hours: "24/7", timezone: "America/New_York", accessInstructions: "No appointment is necessary for emergency-department visits. Call 911 for ambulance transportation in an emergency.", officialSourceUrl: "https://cayugahealth.org/contact/cayuga-medical-center/", tags: ["crisis", "hospital", "local", "24/7"],
  }),
  verifiedResource({
    id: "caps_access", officialName: "Cornell Health CAPS access appointment", description: "A 20-minute first step for discussing concerns and exploring mental health support options; it is not a counseling session.", category: "Cornell", eligibility: "Registered Cornell students who are eligible to use Cornell Health; location rules apply to telehealth.", cost: "No charge for the access appointment. Any later service may have different costs; confirm current charges with Cornell Health.", phone: "607-255-5155", textAction: null, url: "https://health.cornell.edu/services/mental-health-care/access", location: "Usually Zoom; call to request an in-person appointment at Cornell Health", hours: "Schedule online or call during Cornell Health business hours", timezone: "America/New_York", accessInstructions: "Schedule in myCornellHealth or call 607-255-5155. For significant distress, call that number 24/7 or come to Cornell Health during business hours.", officialSourceUrl: "https://health.cornell.edu/services/mental-health-care/access", tags: ["therapy", "mental health"],
  }),
  verifiedResource({
    id: "lets_talk", officialName: "Let’s Talk Drop-In Consultation", description: "A brief, informal consultation with a Cornell Health counselor; it is not counseling or urgent care.", category: "Cornell", eligibility: "Cornell students.", cost: "No charge.", phone: null, textAction: null, url: "https://health.cornell.edu/services/mental-health-care/lets-talk", location: "Campus locations and Zoom options vary by term", hours: "Schedule varies by term; check the current official page before attending", timezone: "America/New_York", accessInstructions: "Sessions are first-come, first-served and do not require an appointment. Use 911, 988, or Cornell Health for urgent or emergency needs.", officialSourceUrl: "https://health.cornell.edu/services/mental-health-care/lets-talk", tags: ["drop-in", "mental health"],
  }),
  verifiedResource({
    id: "ears", officialName: "EARS Peer Mentoring", description: "Informal student-to-student listening, support, and referral for topics common to the student experience; this is peer mentoring, not counseling.", category: "Cornell", eligibility: "Currently enrolled Cornell undergraduate, graduate, and professional students.", cost: "No charge for drop-in peer mentoring.", phone: null, textAction: null, url: "https://mentalhealth.cornell.edu/node/141", location: "Current Cornell page lists North Campus, Central Campus, and Collegetown drop-in locations", hours: "Tuesday, Wednesday, and Thursday evenings during scheduled drop-in periods", timezone: "America/New_York", accessInstructions: "No appointment is required. Check the linked official schedule before attending; use professional crisis services for clinical concerns or thoughts of suicide.", officialSourceUrl: "https://mentalhealth.cornell.edu/node/141", tags: ["peer", "talk"],
  }),
  verifiedResource({
    id: "learning_strategies", officialName: "Learning Strategies Center", description: "Academic support including study-skills resources, supplemental courses, tutoring, and learning support programs.", category: "Cornell", eligibility: "Program eligibility varies; many services focus on Cornell undergraduate students.", cost: "Many listed resources and drop-in tutoring options are free; course or program rules vary.", phone: null, textAction: null, url: "https://lsc.cornell.edu", location: "Programs use multiple campus and online locations", hours: "Varies by program and academic term", timezone: "America/New_York", accessInstructions: "Review the current program page and schedule before attending or enrolling.", officialSourceUrl: "https://lsc.cornell.edu", tags: ["academics", "learning"],
  }),
  verifiedResource({
    id: "basic_needs", officialName: "Cornell Food Pantry", description: "Food and personal-care items for eligible Cornell students, staff, and faculty after enrollment.", category: "Cornell", eligibility: "Cornell students, staff, and faculty whose household income is at or below 200% of federal poverty guidelines or who participate in a listed assistance program.", cost: "No charge; visit limits apply to some high-demand items.", phone: null, textAction: null, url: "https://scl.cornell.edu/residential-life/dining/about-dining/food-security/cornell-food-pantry", location: "109 McGraw Place; entrance is on the southwest-facing side of the building", hours: "Regular hours: Tue/Thu 4–7 p.m., Wed/Fri 10 a.m.–1 p.m., Sun noon–3 p.m.; hours vary during breaks", timezone: "America/New_York", accessInstructions: "Enroll through the official Food Pantry page before visiting. Cornell states that proof of eligibility is not requested, but enrollment and a state form are required.", officialSourceUrl: "https://scl.cornell.edu/residential-life/dining/about-dining/food-security/cornell-food-pantry", tags: ["food", "financial", "local"],
  }),
  verifiedResource({
    id: "identity_support", officialName: "Cornell LGBT Resource Center", description: "Community, advocacy, education, and support for LGBTQ+ Cornell students and community members.", category: "Cornell", eligibility: "Cornell students and community members seeking LGBT Resource Center programs or support.", cost: "No fee is listed for visiting the center or contacting staff; individual programs may have separate terms.", phone: "607-254-4987", textAction: null, url: "https://scl.cornell.edu/LGBTRC", location: "626 Thurston Avenue, third floor, Ithaca, NY 14853", hours: "Staff: Mon–Fri 9 a.m.–5 p.m.; building: Mon–Thu 9 a.m.–8 p.m., Fri 9 a.m.–7 p.m.; closed weekends", timezone: "America/New_York", accessInstructions: "Visit the official page for current programs or contact lgbtrc@cornell.edu.", officialSourceUrl: "https://scl.cornell.edu/LGBTRC", tags: ["identity", "belonging", "lgbtq"],
  }),
  verifiedResource({
    id: "financial_aid_emergency_fund", officialName: "Cornell University Emergency Fund", description: "Grants for urgent, unanticipated expenses that could prevent an eligible student from continuing their education.", category: "Cornell", eligibility: "Currently enrolled Cornell students; priority is given to students with significant financial need, and additional fund-specific rules apply.", cost: "This is grant funding, not a paid service; grants are typically limited to $500 per academic year.", phone: "607-255-5145", textAction: null, url: "https://finaid.cornell.edu/emergency-funds", location: "Office of Financial Aid and Student Employment, 203 Day Hall", hours: "Office: Mon–Thu 10 a.m.–1 p.m. and 2–4 p.m.; phone and virtual assistance: Mon–Fri during those hours", timezone: "America/New_York", accessInstructions: "Review the current criteria and submit the application linked from the official page; funding is not guaranteed.", officialSourceUrl: "https://finaid.cornell.edu/emergency-funds", tags: ["financial", "emergency"],
  }),
  verifiedResource({
    id: "cornell_botanic_gardens", officialName: "Cornell Botanic Gardens", description: "Gardens, natural areas, and trails operated by Cornell Botanic Gardens.", category: "Stress Relief", eligibility: "Open to visitors, subject to location conditions, closures, and posted rules.", cost: "Gardens and natural areas are free; weekday metered parking near the Nevin Welcome Center costs $1.50 per hour.", phone: "607-255-2400", textAction: null, url: "https://cornellbotanicgardens.org/visit/visitor-faq/", location: "Nevin Welcome Center, 124 Comstock Knoll Drive, Ithaca, NY 14850", hours: "Gardens and natural areas: dawn to dusk daily, year-round; Welcome Center hours are seasonal", timezone: "America/New_York", accessInstructions: "Check current seasonal hours, closures, accessibility information, and parking rules before visiting.", officialSourceUrl: "https://cornellbotanicgardens.org/visit/visitor-faq/", tags: ["nature", "outdoor", "local"],
  }),
  verifiedResource({
    id: "helen_newman_fitness", officialName: "Helen Newman Hall", description: "A Cornell recreation facility with a fitness center, pool, courts, studios, and bowling center; access rules differ by activity.", category: "Physical", eligibility: "Primarily the Cornell community; some facilities and activities require a current membership or pass.", cost: "Not universally free. Fitness-center access and some activities require a paid membership or pass; other student recreation access depends on affiliation and activity.", phone: "607-255-8164", textAction: null, url: "https://scl.cornell.edu/recreation/recreation/facility/helen-newman-hall", location: "163 Cradit Farm Road, Ithaca, NY 14850", hours: "Building and fitness-center hours differ and change by term; check both official schedules before visiting", timezone: "America/New_York", accessInstructions: "Confirm current building hours, fitness-center hours, closures, and the membership or pass required for the activity you plan to use.", officialSourceUrl: "https://scl.cornell.edu/recreation/recreation/facility/helen-newman-hall", tags: ["fitness", "physical", "local"],
  }),
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
    for (const field of ["officialName", "description", "eligibility", "cost", "location", "hours", "timezone", "accessInstructions", "whatHappensNext", "officialSourceUrl", "verifier"] as const) {
      if (typeof resource[field] !== "string" || !resource[field].trim()) errors.push(`${prefix}: ${field} is required`)
    }
    if (!RESOURCE_CATEGORIES.includes(resource.category)) errors.push(`${prefix}: invalid category`)
    if (!RESOURCE_REVIEW_STATUSES.includes(resource.reviewStatus)) errors.push(`${prefix}: invalid reviewStatus`)
    if (!isHttpUrl(resource.officialSourceUrl)) errors.push(`${prefix}: officialSourceUrl must be an HTTP(S) URL`)
    if (resource.url !== null && !isHttpUrl(resource.url)) errors.push(`${prefix}: url must be null or an HTTP(S) URL`)
    if (resource.phone !== null && !/^[0-9-]+$/.test(resource.phone)) errors.push(`${prefix}: phone has an invalid format`)
    if (resource.textAction && (!/^[0-9]+$/.test(resource.textAction.number) || !resource.textAction.prefilledText.trim())) errors.push(`${prefix}: malformed textAction`)
    if (!Array.isArray(resource.tags) || resource.tags.length === 0 || resource.tags.some(tag => typeof tag !== "string" || !tag.trim())) errors.push(`${prefix}: tags must contain non-empty strings`)
    if (!["free", "paid", "varies"].includes(resource.costType)) errors.push(`${prefix}: invalid costType`)
    if (!["emergency", "urgent", "routine"].includes(resource.urgency)) errors.push(`${prefix}: invalid urgency`)
    if (!["campus", "community", "national"].includes(resource.scope)) errors.push(`${prefix}: invalid scope`)
    if (!["required", "not_required", "varies"].includes(resource.appointmentRequirement)) errors.push(`${prefix}: invalid appointmentRequirement`)
    if (!Array.isArray(resource.eligibilityGroups) || resource.eligibilityGroups.length === 0 || resource.eligibilityGroups.some(group => !["anyone", "cornell_student", "cornell_community"].includes(group))) errors.push(`${prefix}: invalid eligibilityGroups`)
    if (!Array.isArray(resource.modalities) || resource.modalities.length === 0 || resource.modalities.some(modality => !["phone", "text", "online", "in_person"].includes(modality))) errors.push(`${prefix}: invalid modalities`)
    if (!resource.availability || !["always", "weekly", "variable"].includes(resource.availability.kind)) errors.push(`${prefix}: invalid availability`)
    if (resource.availability?.kind === "weekly") {
      const intervals = [...resource.availability.intervals, ...(resource.availability.overrides || []).flatMap(override => override.intervals)]
      if (resource.availability.intervals.length === 0) errors.push(`${prefix}: weekly availability requires intervals`)
      if (intervals.some(interval => interval.days.length === 0 || interval.days.some(day => !["sun", "mon", "tue", "wed", "thu", "fri", "sat"].includes(day)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(interval.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(interval.end))) errors.push(`${prefix}: malformed availability interval`)
      if ((resource.availability.overrides || []).some(override => !/^\d{4}-\d{2}-\d{2}$/.test(override.from) || !/^\d{4}-\d{2}-\d{2}$/.test(override.through) || override.from > override.through)) errors.push(`${prefix}: malformed availability override`)
    }
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
