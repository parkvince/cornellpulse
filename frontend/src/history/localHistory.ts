export const HISTORY_KEY = "cornellpulse_history"
export const HISTORY_SETTINGS_KEY = "cornellpulse_history_settings"
export const MAX_HISTORY_ENTRIES = 20
export const DEFAULT_RETENTION_DAYS = 90

export type PlanStatus = "saved" | "completed" | "dismissed"
export type ContactOutcome = "contacted" | "not_contacted"
export type FitOutcome = "fit" | "not_fit" | "unsure"
export type RetentionDays = 30 | 90 | 365 | null

export interface LocalPlanEntry {
  id: string
  date: string
  mood: number
  resource: string
  resourceId: string
  status: PlanStatus
  reminderAt?: string
  contacted?: ContactOutcome
  fit?: FitOutcome
  updatedAt?: string
}

interface HistorySettings {
  retentionDays: RetentionDays
}

type ReadStorage = Pick<Storage, "getItem">
type WriteStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(new Date(value).getTime())
}

function normalizeEntry(value: unknown): LocalPlanEntry | null {
  if (!value || typeof value !== "object") return null
  const entry = value as Partial<LocalPlanEntry>
  if (typeof entry.id !== "string" || !entry.id.trim()) return null
  if (!validDate(entry.date) || typeof entry.mood !== "number" || entry.mood < 1 || entry.mood > 10) return null
  if (typeof entry.resource !== "string" || !entry.resource.trim() || typeof entry.resourceId !== "string" || !entry.resourceId.trim()) return null
  const status: PlanStatus = ["saved", "completed", "dismissed"].includes(entry.status || "") ? entry.status as PlanStatus : "saved"
  return {
    id: entry.id,
    date: entry.date,
    mood: entry.mood,
    resource: entry.resource,
    resourceId: entry.resourceId,
    status,
    ...(validDate(entry.reminderAt) ? { reminderAt: entry.reminderAt } : {}),
    ...(["contacted", "not_contacted"].includes(entry.contacted || "") ? { contacted: entry.contacted as ContactOutcome } : {}),
    ...(["fit", "not_fit", "unsure"].includes(entry.fit || "") ? { fit: entry.fit as FitOutcome } : {}),
    ...(validDate(entry.updatedAt) ? { updatedAt: entry.updatedAt } : {}),
  }
}

export function getHistoryRetention(storage: ReadStorage = localStorage): RetentionDays {
  try {
    const value = (JSON.parse(storage.getItem(HISTORY_SETTINGS_KEY) || "null") as Partial<HistorySettings> | null)?.retentionDays
    return value === null || value === 30 || value === 90 || value === 365 ? value : DEFAULT_RETENTION_DAYS
  } catch {
    return DEFAULT_RETENTION_DAYS
  }
}

export function loadLocalHistory(storage: ReadStorage = localStorage, now = new Date()): LocalPlanEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(HISTORY_KEY) || "[]")
    if (!Array.isArray(parsed)) return []
    const retentionDays = getHistoryRetention(storage)
    const cutoff = retentionDays === null ? Number.NEGATIVE_INFINITY : now.getTime() - retentionDays * 86_400_000
    return parsed.map(normalizeEntry).filter((entry): entry is LocalPlanEntry => !!entry && new Date(entry.date).getTime() >= cutoff).slice(0, MAX_HISTORY_ENTRIES)
  } catch {
    return []
  }
}

function persist(entries: LocalPlanEntry[], storage: Pick<Storage, "setItem">): LocalPlanEntry[] {
  const limited = entries.slice(0, MAX_HISTORY_ENTRIES)
  storage.setItem(HISTORY_KEY, JSON.stringify(limited))
  return limited
}

export function savePlanEntry(entry: Omit<LocalPlanEntry, "status"> & { status?: PlanStatus }, storage: Pick<Storage, "getItem" | "setItem"> = localStorage, now = new Date()): LocalPlanEntry {
  const normalized: LocalPlanEntry = { ...entry, status: entry.status || "saved", updatedAt: now.toISOString() }
  const history = loadLocalHistory(storage, now).filter(item => item.id !== normalized.id)
  persist([normalized, ...history], storage)
  return normalized
}

export function updatePlanEntry(id: string, changes: Partial<Pick<LocalPlanEntry, "resource" | "resourceId" | "status" | "reminderAt" | "contacted" | "fit">>, storage: WriteStorage = localStorage, now = new Date()): LocalPlanEntry[] {
  const updated = loadLocalHistory(storage, now).map(entry => entry.id === id ? { ...entry, ...changes, updatedAt: now.toISOString() } : entry)
  return persist(updated, storage)
}

export function deletePlanEntry(id: string, storage: WriteStorage = localStorage, now = new Date()): LocalPlanEntry[] {
  return persist(loadLocalHistory(storage, now).filter(entry => entry.id !== id), storage)
}

export function clearLocalHistory(storage: Pick<Storage, "removeItem"> = localStorage): void {
  storage.removeItem(HISTORY_KEY)
}

export function setHistoryRetention(retentionDays: RetentionDays, storage: WriteStorage = localStorage, now = new Date()): LocalPlanEntry[] {
  storage.setItem(HISTORY_SETTINGS_KEY, JSON.stringify({ retentionDays }))
  return persist(loadLocalHistory(storage, now), storage)
}

export function reminderIsDue(entry: LocalPlanEntry, now = new Date()): boolean {
  return !!entry.reminderAt && entry.status === "saved" && new Date(entry.reminderAt).getTime() <= now.getTime()
}

export function exportLocalHistory(entries: readonly LocalPlanEntry[], exportedAt = new Date()): string {
  return JSON.stringify({
    exportVersion: 1,
    exportedAt: exportedAt.toISOString(),
    storage: "This export was created from this device. CornellPulse did not upload it.",
    history: entries,
  }, null, 2)
}
