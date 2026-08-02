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

const RESOURCES: Record<string, Resource> = {
  cornell_health: { resource_id: "cornell_health", name: "Cornell Health 24/7", tagline: "Talk to a health professional any time. Press 2 for mental health support.", phone: "607-255-5155", url: "https://health.cornell.edu", hours: "24/7 including holidays", how_to_access: "Call 607-255-5155 and press 2 for mental health support.", tags: ["24/7", "health"] },
  crisis_988: { resource_id: "crisis_988", name: "988 Suicide and Crisis Lifeline", tagline: "Call or text 988 for immediate crisis support.", phone: "988", url: "https://988lifeline.org", hours: "24/7", how_to_access: "Call or text 988 from any phone.", tags: ["crisis", "24/7"] },
  ears: { resource_id: "ears", name: "EARS Peer Counseling", tagline: "Confidential peer counseling with trained Cornell students.", phone: "607-255-4050", url: "https://ears.cornell.edu", hours: "Check current hours", how_to_access: "Call EARS or review its current walk-in options.", tags: ["peer", "talk"] },
  learning_strategies: { resource_id: "learning_strategies", name: "Learning Strategies Center", tagline: "Academic support, study strategies, and tutoring resources.", url: "https://lsc.cornell.edu", how_to_access: "Review current programs and appointment options online.", tags: ["academics"] },
  basic_needs: { resource_id: "basic_needs", name: "Cornell Basic Needs", tagline: "Support for food, housing, finances, and other essential needs.", url: "https://basicneeds.cornell.edu", how_to_access: "Review current assistance options online.", tags: ["financial", "housing"] },
  identity_support: { resource_id: "identity_support", name: "Cornell identity and belonging resources", tagline: "Find community and support resources related to identity and belonging.", url: "https://scl.cornell.edu/identity-resources", how_to_access: "Review current campus identity-resource options.", tags: ["identity", "belonging"] },
}

const CRISIS_PATTERN = /\b(suicid(?:e|al)|kill myself|end my life|want to die|hurt myself|self[- ]harm|not worth living)\b/i

export function buildLocalRecommendation(input: LocalCheckInInput) {
  const crisis = input.mood <= 2 || CRISIS_PATTERN.test(input.freeText)
  const distress = crisis || input.mood <= 3 ? "high" : input.mood <= 6 ? "moderate" : "low"
  let primary = RESOURCES.cornell_health

  if (crisis) primary = RESOURCES.crisis_988
  else if (input.triggers.includes("financial") || input.triggers.includes("housing")) primary = RESOURCES.basic_needs
  else if (input.triggers.includes("identity") || input.triggers.includes("discrimination")) primary = RESOURCES.identity_support
  else if (input.triggers.includes("academics") || input.workload === "unbearable") primary = RESOURCES.learning_strategies
  else if (input.wantsToTalk || input.triggers.includes("loneliness") || input.triggers.includes("social")) primary = RESOURCES.ears

  const secondary = Object.values(RESOURCES).filter(resource => resource.resource_id !== primary.resource_id && resource.resource_id !== "crisis_988").slice(0, 2)
  return {
    triage_result: {
      distress_level: distress,
      crisis_flag: crisis,
      why: crisis ? "Your on-device answers indicate that immediate support may be appropriate." : "This suggestion was generated on this device from the choices you entered.",
      primary,
      secondary,
      show_peer_connect: false,
    },
  }
}
