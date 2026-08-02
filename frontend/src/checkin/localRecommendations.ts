export interface LocalCheckInInput {
  mood: number
  sleep: string
  workload: string
  triggers: string[]
  wantsToTalk: boolean | null
  freeText: string
}

import { getResource, type ResourceRecord } from "../resources/registry.ts"

export type SafetySignal = "urgent" | "check-in" | "none"

export interface SafetyAssessment {
  signal: SafetySignal
  reason: "explicit-language" | "ambiguous-language" | "low-mood" | "none"
}

export interface QualifiedResourceOption {
  resource: ResourceRecord
  why: string
}

const RECOMMENDATION_RESOURCE_IDS = ["emergency_911", "988_lifeline", "cornell_health_247", "caps_access", "lets_talk", "ears", "learning_strategies", "basic_needs", "identity_support", "financial_aid_emergency_fund"] as const
const recommendationResources = Object.fromEntries(RECOMMENDATION_RESOURCE_IDS.map(id => [id, getResource(id)])) as Record<typeof RECOMMENDATION_RESOURCE_IDS[number], ResourceRecord>

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
  let options: QualifiedResourceOption[]

  if (safety.signal === "urgent") {
    options = [
      { resource: recommendationResources.emergency_911, why: "May fit if there is an immediate threat to life or you cannot stay safe. CornellPulse cannot dispatch emergency help." },
      { resource: recommendationResources["988_lifeline"], why: "May fit for immediate crisis support by call or text when emergency dispatch is not needed." },
      { resource: recommendationResources.cornell_health_247, why: "May fit for 24/7 consultation with a Cornell Health provider if you are a Cornell student in the United States." },
    ]
  } else if (safety.signal === "check-in") {
    options = [
      { resource: recommendationResources["988_lifeline"], why: "May fit if talking with a crisis counselor now would help, even if you are unsure whether the situation is a crisis." },
      { resource: recommendationResources.cornell_health_247, why: "May fit for 24/7 consultation with a Cornell Health provider about what to do next." },
      { resource: recommendationResources.caps_access, why: "May fit as a non-urgent next step for exploring Cornell mental-health support options." },
    ]
  } else if (input.triggers.includes("financial") || input.triggers.includes("housing")) {
    options = [
      { resource: recommendationResources.basic_needs, why: "May fit because you selected a financial or housing concern and want practical basic-needs support." },
      { resource: recommendationResources.financial_aid_emergency_fund, why: "May fit if an urgent, unexpected expense could interrupt your Cornell education; eligibility and funding are not guaranteed." },
      { resource: recommendationResources.cornell_health_247, why: "May fit if the situation is also affecting your wellbeing and you want to discuss support options with a provider." },
    ]
  } else if (input.triggers.includes("identity") || input.triggers.includes("discrimination")) {
    options = [
      { resource: recommendationResources.identity_support, why: "May fit because you selected an identity or discrimination concern and want community, advocacy, or support information." },
      { resource: recommendationResources.ears, why: "May fit if you would prefer informal student-to-student listening rather than clinical care." },
      { resource: recommendationResources.caps_access, why: "May fit if you want to explore professional mental-health support through Cornell Health." },
    ]
  } else if (input.triggers.includes("academics") || input.workload === "unbearable") {
    options = [
      { resource: recommendationResources.learning_strategies, why: "May fit because you selected academic pressure or a workload that feels difficult to manage." },
      { resource: recommendationResources.lets_talk, why: "May fit if you want a brief, informal conversation with a counselor without starting ongoing counseling." },
      { resource: recommendationResources.caps_access, why: "May fit if you want to discuss broader mental-health support options with Cornell Health." },
    ]
  } else if (input.wantsToTalk || input.triggers.includes("loneliness") || input.triggers.includes("social")) {
    options = [
      { resource: recommendationResources.ears, why: "May fit because you indicated that talking or social connection could be useful, and this is informal peer support." },
      { resource: recommendationResources.lets_talk, why: "May fit if you prefer a brief, informal conversation with a Cornell Health counselor." },
      { resource: recommendationResources.caps_access, why: "May fit if you want to explore professional mental-health support options." },
    ]
  } else {
    options = [
      { resource: recommendationResources.lets_talk, why: "May fit if a brief, informal conversation would help you sort through what is going on." },
      { resource: recommendationResources.caps_access, why: "May fit if you want to explore Cornell Health mental-health support options." },
      { resource: recommendationResources.ears, why: "May fit if you would rather talk informally with a trained student peer mentor." },
    ]
  }

  return {
    safety,
    recommendation: {
      why: "These options are based only on the non-clinical choices you entered. They are not a diagnosis, assessment, or guarantee that a resource will be suitable or available.",
      options,
      show_peer_connect: false,
    },
  }
}
