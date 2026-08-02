export interface LocalCheckInInput {
  mood: number
  sleep: string
  workload: string
  triggers: string[]
  wantsToTalk: boolean | null
  freeText: string
}

export interface Resource {
  resource_id: string
  name: string
  tagline: string
  phone?: string
  url?: string
  hours?: string
  how_to_access?: string
  tags: string[]
}

export type SafetySignal = "urgent" | "check-in" | "none"

export interface SafetyAssessment {
  signal: SafetySignal
  reason: "explicit-language" | "ambiguous-language" | "low-mood" | "none"
}

const RESOURCES: Record<string, Resource> = {
  cornell_health: { resource_id: "cornell_health", name: "Cornell Health 24/7 phone consultation", tagline: "Call any time to consult with a medical or mental health provider.", phone: "607-255-5155", url: "https://health.cornell.edu/get-care/247-phone-consultation", hours: "24/7 phone consultation", how_to_access: "Call 607-255-5155 and follow the prompts. This is consultation, not emergency dispatch.", tags: ["24/7", "health"] },
  ears: { resource_id: "ears", name: "EARS Peer Counseling", tagline: "Peer counseling with trained Cornell students.", phone: "607-255-4050", url: "https://ears.cornell.edu", hours: "Check current hours", how_to_access: "Call EARS or review its current options.", tags: ["peer", "talk"] },
  learning_strategies: { resource_id: "learning_strategies", name: "Learning Strategies Center", tagline: "Academic support, study strategies, and tutoring resources.", url: "https://lsc.cornell.edu", how_to_access: "Review current programs and appointment options online.", tags: ["academics"] },
  basic_needs: { resource_id: "basic_needs", name: "Cornell Basic Needs", tagline: "Support for food, housing, finances, and other essential needs.", url: "https://basicneeds.cornell.edu", how_to_access: "Review current assistance options online.", tags: ["financial", "housing"] },
  identity_support: { resource_id: "identity_support", name: "Cornell identity and belonging resources", tagline: "Explore community and support resources related to identity and belonging.", url: "https://scl.cornell.edu/identity-resources", how_to_access: "Review current campus identity-resource options.", tags: ["identity", "belonging"] },
}

const EXPLICIT_SAFETY_PATTERNS = [
  /\b(?:i\s*(?:am|'m)\s*)?(?:going to|gonna|planning to|plan to|intend to)\s+(?:kill|hurt)\s+myself\b/i,
  /\b(?:i\s*)?(?:want|need)\s+to\s+(?:die|kill myself|end my life|hurt myself)\b/i,
  /\b(?:i\s*)?(?:cannot|can't|do not|don't)\s+(?:keep|stay)\s+(?:myself\s+)?safe\b/i,
  /\bi\s+(?:will|might)\s+(?:kill|hurt)\s+myself\b/i,
]

const NEGATED_SAFETY_PATTERNS = [
  /\b(?:i\s*(?:am|'m)\s*)?not\s+suicidal\b/i,
  /\b(?:i\s*)?(?:do not|don't|never)\s+want\s+to\s+die\b/i,
  /\b(?:i\s*)?(?:would|will)\s+never\s+(?:kill|hurt)\s+myself\b/i,
  /\bno\s+(?:current\s+)?(?:thoughts?|plans?)\s+of\s+(?:suicide|self[- ]harm)\b/i,
  /\bnot\s+(?:going|planning)\s+to\s+(?:kill|hurt)\s+myself\b/i,
]

const OBVIOUS_CONTEXT_PATTERNS = [
  /\b(?:class|essay|paper|article|book|movie|news|research|prevention|awareness|training)\b.{0,40}\b(?:suicide|self[- ]harm)\b/i,
  /\b(?:suicide|self[- ]harm)\b.{0,40}\b(?:class|essay|paper|article|book|movie|news|research|prevention|awareness|training)\b/i,
]

const AMBIGUOUS_SAFETY_PATTERN = /\b(?:suicid(?:e|al)|self[- ]harm|hurt myself|kill myself|want to die|end my life|not worth living|thinking about death|thoughts? of death)\b/i

export function assessSafetySignal(freeText: string, mood: number): SafetyAssessment {
  const text = freeText.trim()
  const textWithoutNegatedPhrases = NEGATED_SAFETY_PATTERNS.reduce((value, pattern) => value.replace(pattern, " "), text)
  if (EXPLICIT_SAFETY_PATTERNS.some(pattern => pattern.test(textWithoutNegatedPhrases))) return { signal: "urgent", reason: "explicit-language" }

  const contextual = OBVIOUS_CONTEXT_PATTERNS.some(pattern => pattern.test(text))
  if (textWithoutNegatedPhrases.trim() && !contextual && AMBIGUOUS_SAFETY_PATTERN.test(textWithoutNegatedPhrases)) return { signal: "check-in", reason: "ambiguous-language" }
  if (mood <= 2) return { signal: "check-in", reason: "low-mood" }
  return { signal: "none", reason: "none" }
}

export function buildLocalRecommendation(input: LocalCheckInInput) {
  const safety = assessSafetySignal(input.freeText, input.mood)
  let primary = RESOURCES.cornell_health

  if (input.triggers.includes("financial") || input.triggers.includes("housing")) primary = RESOURCES.basic_needs
  else if (input.triggers.includes("identity") || input.triggers.includes("discrimination")) primary = RESOURCES.identity_support
  else if (input.triggers.includes("academics") || input.workload === "unbearable") primary = RESOURCES.learning_strategies
  else if (input.wantsToTalk || input.triggers.includes("loneliness") || input.triggers.includes("social")) primary = RESOURCES.ears

  const secondary = Object.values(RESOURCES).filter(resource => resource.resource_id !== primary.resource_id).slice(0, 2)
  return {
    safety,
    recommendation: {
      why: "Based on the non-clinical choices you entered, these are resources you may want to explore.",
      primary,
      secondary,
      show_peer_connect: false,
    },
  }
}
