import { getPrivacyPreferences } from "./preferences"

export const MEASUREMENT_KEY = "cornellpulse_local_measurement"

export type MeasurementEvent = "checkin_completion" | "resource_action" | "successful_contact" | "repeat_use"
export type ResourceAction = "call" | "text" | "book" | "directions" | "website" | "details"

export interface LocalMeasurement {
  checkinCompletion: number
  resourceActions: Record<ResourceAction, number>
  successfulContact: number
  repeatUse: number
}

const EMPTY_ACTIONS: Record<ResourceAction, number> = { call: 0, text: 0, book: 0, directions: 0, website: 0, details: 0 }

export function emptyMeasurement(): LocalMeasurement {
  return { checkinCompletion: 0, resourceActions: { ...EMPTY_ACTIONS }, successfulContact: 0, repeatUse: 0 }
}

export function loadLocalMeasurement(storage: Pick<Storage, "getItem"> = localStorage): LocalMeasurement {
  try {
    const value = JSON.parse(storage.getItem(MEASUREMENT_KEY) || "null") as Partial<LocalMeasurement> | null
    if (!value) return emptyMeasurement()
    const count = (candidate: unknown) => typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 0 ? candidate : 0
    return {
      checkinCompletion: count(value.checkinCompletion),
      resourceActions: Object.fromEntries(Object.keys(EMPTY_ACTIONS).map(action => [action, count(value.resourceActions?.[action as ResourceAction])])) as Record<ResourceAction, number>,
      successfulContact: count(value.successfulContact),
      repeatUse: count(value.repeatUse),
    }
  } catch {
    return emptyMeasurement()
  }
}

export function recordLocalMeasurement(
  event: MeasurementEvent,
  action?: ResourceAction,
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
  consent = getPrivacyPreferences(storage).productMeasurement,
): boolean {
  if (!consent) return false
  const measurement = loadLocalMeasurement(storage)
  if (event === "checkin_completion") measurement.checkinCompletion += 1
  if (event === "successful_contact") measurement.successfulContact += 1
  if (event === "repeat_use") measurement.repeatUse += 1
  if (event === "resource_action" && action && action in measurement.resourceActions) measurement.resourceActions[action] += 1
  storage.setItem(MEASUREMENT_KEY, JSON.stringify(measurement))
  return true
}
