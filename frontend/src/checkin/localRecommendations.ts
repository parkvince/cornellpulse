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

const RECOMMENDATION_RESOURCE_IDS = ["cornell_health_247", "ears", "learning_strategies", "basic_needs", "identity_support"] as const
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
  let primary = recommendationResources.cornell_health_247

  if (input.triggers.includes("financial") || input.triggers.includes("housing")) primary = recommendationResources.basic_needs
  else if (input.triggers.includes("identity") || input.triggers.includes("discrimination")) primary = recommendationResources.identity_support
  else if (input.triggers.includes("academics") || input.workload === "unbearable") primary = recommendationResources.learning_strategies
  else if (input.wantsToTalk || input.triggers.includes("loneliness") || input.triggers.includes("social")) primary = recommendationResources.ears

  const secondary = Object.values(recommendationResources).filter(resource => resource.id !== primary.id).slice(0, 2)
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
