export const PRIVACY_PREFERENCES_KEY = "cornellpulse_privacy_preferences"

export interface PrivacyPreferences {
  aggregateContribution: boolean
  resourceAnalytics: boolean
  productMeasurement: boolean
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  aggregateContribution: false,
  resourceAnalytics: false,
  productMeasurement: false,
}

export function parsePrivacyPreferences(raw: string | null): PrivacyPreferences {
  if (!raw) return { ...DEFAULT_PRIVACY_PREFERENCES }
  try {
    const parsed = JSON.parse(raw) as Partial<PrivacyPreferences>
    return {
      aggregateContribution: parsed.aggregateContribution === true,
      resourceAnalytics: parsed.resourceAnalytics === true,
      productMeasurement: parsed.productMeasurement === true,
    }
  } catch {
    return { ...DEFAULT_PRIVACY_PREFERENCES }
  }
}

export function getPrivacyPreferences(storage: Pick<Storage, "getItem"> = localStorage): PrivacyPreferences {
  return parsePrivacyPreferences(storage.getItem(PRIVACY_PREFERENCES_KEY))
}

export function savePrivacyPreferences(preferences: PrivacyPreferences, storage: Pick<Storage, "setItem"> = localStorage): void {
  storage.setItem(PRIVACY_PREFERENCES_KEY, JSON.stringify(preferences))
}

export function clearCornellPulseDeviceData(storage: Pick<Storage, "removeItem"> = localStorage, session: Pick<Storage, "removeItem"> = sessionStorage): void {
  storage.removeItem("cornellpulse_history")
  storage.removeItem("cornellpulse_history_settings")
  storage.removeItem("cornellpulse_local_measurement")
  storage.removeItem("cornellpulse_onboarded")
  storage.removeItem(PRIVACY_PREFERENCES_KEY)
  session.removeItem("cornellpulse_checkin_draft")
  session.removeItem("cornellpulse_checkin_draft_v2")
  session.removeItem("cornellpulse_result_saved")
}
